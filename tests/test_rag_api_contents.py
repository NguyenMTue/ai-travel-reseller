"""Unit coverage for the BE3 contents persistence contract (no live Supabase)."""

import sys
import unittest
from pathlib import Path
from unittest.mock import patch


SERVICE_DIR = Path(__file__).resolve().parents[1] / "services" / "llm-service"
sys.path.insert(0, str(SERVICE_DIR))

from rag_api import (  # noqa: E402
    CampaignScriptDraft,
    ContentDraft,
    SaveCampaignContentsRequest,
    _format_script,
    _guard_content,
    save_campaign_contents,
)


def make_rows(full_kit_for_all=False):
    rows = []
    for index in range(10):
        row = {
            "persona": "family",
            "hook": f"Cả nhà cùng khám phá hành trình du lịch tuyệt vời số {index:02d}!",
        }
        if index < 5 or full_kit_for_all:
            asset_index = index % 5
            row.update(
                script={
                    "title": f"Kịch bản trải nghiệm gia đình phần {asset_index}",
                    "duration": 35,
                    "scenes": [
                        "Cả nhà bắt đầu hành trình trong không khí vui vẻ.",
                        "Khám phá điểm đến cùng hướng dẫn viên địa phương.",
                        "Lưu lại khoảnh khắc đáng nhớ bên gia đình.",
                    ],
                },
                caption=f"Cùng gia đình khám phá điểm đến hấp dẫn số {asset_index}! #DuLich",
                cta=f"Đặt vé ngay tại [LINK_MUA_VE] để giữ chỗ phần {asset_index}.",
            )
        else:
            row.update(script=None, caption=None, cta=None)
        rows.append(row)
    return rows


class ContentBatchContractTests(unittest.TestCase):
    def test_accepts_one_ten_row_persona_batch_with_nullable_tail(self):
        request = SaveCampaignContentsRequest(
            campaign_id="44444444-4444-4444-4444-111111111111",
            records=make_rows(),
        )
        self.assertEqual(len(request.records), 10)
        self.assertTrue(all(row.persona == "family" for row in request.records))
        self.assertTrue(all(row.script is None for row in request.records[5:]))

    def test_accepts_full_content_kit_on_all_ten_demo_variants(self):
        request = SaveCampaignContentsRequest(
            campaign_id="44444444-4444-4444-4444-111111111111",
            records=make_rows(full_kit_for_all=True),
        )
        self.assertTrue(all(row.script is not None for row in request.records))
        self.assertTrue(all(row.caption is not None for row in request.records))
        self.assertTrue(all(row.cta is not None for row in request.records))

    def test_rejects_partial_assets_on_hook_only_compatibility_rows(self):
        rows = make_rows()
        rows[5]["caption"] = "Cùng gia đình khám phá điểm đến hấp dẫn! #DuLich"
        request = SaveCampaignContentsRequest(
            campaign_id="44444444-4444-4444-4444-111111111111",
            records=rows,
        )
        with patch.dict("os.environ", {"CONTENTS_API_KEY": "k" * 40}), patch(
            "rag_api.get_supabase"
        ) as get_supabase:
            with self.assertRaises(Exception) as raised:
                save_campaign_contents(request, x_api_key="k" * 40)
        self.assertIn("Rows 6-10 must either include", str(raised.exception))
        get_supabase.assert_not_called()

    def test_script_object_is_formatted_as_text(self):
        script = CampaignScriptDraft(
            title="Một hành trình vui vẻ",
            duration=35,
            scenes=[
                "Cả nhà bắt đầu chuyến đi cùng nhau.",
                "Khám phá điểm đến nổi tiếng trong ngày.",
                "Cùng lưu lại những kỷ niệm đáng nhớ.",
            ],
        )
        rendered = _format_script(script)
        self.assertIn("Thời lượng: 35 giây", rendered)
        self.assertIn("3. Cùng lưu lại", rendered)

    def test_rejects_non_ten_item_batch(self):
        with self.assertRaises(ValueError):
            SaveCampaignContentsRequest(
                campaign_id="44444444-4444-4444-4444-111111111111",
                records=make_rows()[:9],
            )

    def test_guardrails_compute_status_inputs_from_verified_product(self):
        product = {
            "original_price": 1_000_000,
            "sale_price": 800_000,
            "confirmed_promo_codes": ["SALE10"],
            "verified_facts": ["Bao gồm miễn phí khách sạn"],
        }
        self.assertEqual(_guard_content("Giá 900.000đ, mã SALE99", product), [
            "PRICE_MISMATCH",
            "UNCONFIRMED_PROMO_CODE",
        ])
        self.assertEqual(_guard_content("Miễn phí khách sạn", product), [])
        self.assertEqual(_guard_content("Đảm bảo rẻ nhất", product), ["PROHIBITED_CLAIM"])
        self.assertEqual(_guard_content("Miễn phí vé trẻ em", product), ["PROHIBITED_CLAIM"])
        self.assertEqual(_guard_content("Chỉ còn đúng 2 vé hôm nay", product), ["PROHIBITED_CLAIM"])
        self.assertEqual(_guard_content("Nhận vé chính hãng với giá ưu đãi mới nhất", product), ["PROHIBITED_CLAIM"])
        self.assertEqual(_guard_content("Đặt trước để không phải xếp hàng mua vé", product), ["PROHIBITED_CLAIM"])
        self.assertEqual(_guard_content("Cam kết không phát sinh chi phí ẩn", product), ["PROHIBITED_CLAIM"])
        self.assertEqual(_guard_content("Điểm đến hot nhất với không gian siêu rộng lớn", product), ["PROHIBITED_CLAIM"])

    def test_guardrails_allow_policy_claim_only_when_verified(self):
        product = {
            "original_price": 600_000,
            "sale_price": 510_000,
            "verified_facts": ["Trẻ em được miễn phí vé vào cửa"],
        }
        self.assertEqual(_guard_content("Trẻ em được miễn phí vé vào cửa", product), [])

    def test_gemini_cannot_supply_persistence_status(self):
        row = make_rows()[0] | {"status": "approved"}
        with self.assertRaises(ValueError):
            ContentDraft.model_validate(row)

    def test_batch_retry_returns_same_ten_rows_without_adding_duplicates(self):
        class FakeQuery:
            def __init__(self, db, table):
                self.db, self.table = db, table
                self.filters = {}
                self.keys = None
                self.pending = []

            def select(self, *_args):
                return self

            def eq(self, key, value):
                self.filters[key] = value
                return self

            def in_(self, key, values):
                self.keys = (key, set(values))
                return self

            def maybe_single(self):
                return self

            def upsert(self, rows, **_kwargs):
                self.pending = rows
                return self

            def execute(self):
                if self.table == "campaigns":
                    return type("Result", (), {"data": {"id": campaign_id, "product_id": product_id}})()
                if self.table == "products":
                    return type("Result", (), {"data": {
                        "id": product_id,
                        "original_price": 1_000_000,
                        "sale_price": 800_000,
                        "confirmed_promo_codes": [],
                        "verified_facts": [],
                    }})()
                existing = self.db.rows
                for row in self.pending:
                    if not any(saved["generation_key"] == row["generation_key"] for saved in existing):
                        existing.append({**row, "id": f"content-{len(existing)}"})
                selected = existing
                if self.keys:
                    key, values = self.keys
                    selected = [row for row in selected if row.get(key) in values]
                return type("Result", (), {"data": selected})()

        class FakeSupabase:
            def __init__(self):
                self.rows = []

            def table(self, table):
                return FakeQuery(self, table)

        campaign_id = "44444444-4444-4444-4444-111111111111"
        product_id = "33333333-3333-3333-3333-444444444444"
        fake = FakeSupabase()
        payload = {"campaign_id": campaign_id, "records": make_rows(full_kit_for_all=True)}
        with patch.dict("os.environ", {"CONTENTS_API_KEY": "k" * 40}), patch(
            "rag_api.get_supabase", return_value=fake
        ):
            request = SaveCampaignContentsRequest.model_validate(payload)
            first = save_campaign_contents(request, x_api_key="k" * 40)
            retry = save_campaign_contents(request, x_api_key="k" * 40)
        self.assertEqual(first["inserted_count"], 10)
        self.assertEqual(first["content_ids"], retry["content_ids"])
        self.assertEqual(len(fake.rows), 10)
        self.assertEqual(first["status"], "approved")


if __name__ == "__main__":
    unittest.main()
