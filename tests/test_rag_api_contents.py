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

            def upsert(self, rows, on_conflict=None, ignore_duplicates=False, **_kwargs):
                self.pending = rows
                self.ignore_duplicates = ignore_duplicates
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
                upserted = []
                for row in self.pending:
                    match_idx = None
                    for i, saved in enumerate(existing):
                        if saved["generation_key"] == row["generation_key"]:
                            match_idx = i
                            break
                    if match_idx is not None:
                        if not getattr(self, "ignore_duplicates", False):
                            existing[match_idx] = {**existing[match_idx], **row}
                        upserted.append(existing[match_idx])
                    else:
                        new_row = {**row, "id": f"content-{len(existing)}"}
                        existing.append(new_row)
                        upserted.append(new_row)
                selected = existing
                if self.keys:
                    key, values = self.keys
                    selected = [row for row in selected if row.get(key) in values]
                elif getattr(self, "pending", None):
                    selected = upserted
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
        self.assertEqual(first["persisted_count"], 10)
        self.assertEqual(first["updated_count"], 0)
        self.assertEqual(retry["inserted_count"], 0)
        self.assertEqual(retry["persisted_count"], 10)
        self.assertEqual(retry["updated_count"], 10)
        self.assertEqual(first["content_ids"], retry["content_ids"])
        self.assertEqual(len(fake.rows), 10)
        self.assertEqual(first["status"], "approved")
        self.assertEqual(retry["status"], "approved")

    def test_reproduce_and_fix_status_change_from_needs_review_to_approved(self):
        """Part 1: If first run persisted needs_review and second run has valid output (approved),
        database rows must be updated to approved, no duplicates created, and API response matches DB."""
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

            def upsert(self, rows, on_conflict=None, ignore_duplicates=False, **_kwargs):
                self.pending = rows
                self.ignore_duplicates = ignore_duplicates
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
                upserted = []
                for row in self.pending:
                    match_idx = None
                    for i, saved in enumerate(existing):
                        if saved["generation_key"] == row["generation_key"]:
                            match_idx = i
                            break
                    if match_idx is not None:
                        if not getattr(self, "ignore_duplicates", False):
                            existing[match_idx] = {**existing[match_idx], **row}
                        upserted.append(existing[match_idx])
                    else:
                        new_row = {**row, "id": f"content-{len(existing)}"}
                        existing.append(new_row)
                        upserted.append(new_row)
                selected = existing
                if self.keys:
                    key, values = self.keys
                    selected = [row for row in selected if row.get(key) in values]
                elif getattr(self, "pending", None):
                    selected = upserted
                return type("Result", (), {"data": selected})()

        class FakeSupabase:
            def __init__(self):
                self.rows = []

            def table(self, table):
                return FakeQuery(self, table)

        campaign_id = "44444444-4444-4444-4444-111111111111"
        product_id = "33333333-3333-3333-3333-444444444444"
        fake = FakeSupabase()

        # Step 1: First run with price mismatch (Giá 999.000đ != 800.000đ)
        invalid_rows = make_rows(full_kit_for_all=True)
        for r in invalid_rows:
            r["caption"] = "Giá chỉ 999.000đ cực kỳ hấp dẫn dành cho mọi nhà! #DuLich"

        payload_1 = {"campaign_id": campaign_id, "records": invalid_rows}
        with patch.dict("os.environ", {"CONTENTS_API_KEY": "k" * 40}), patch(
            "rag_api.get_supabase", return_value=fake
        ):
            req_1 = SaveCampaignContentsRequest.model_validate(payload_1)
            resp_1 = save_campaign_contents(req_1, x_api_key="k" * 40)

        self.assertEqual(resp_1["status"], "needs_review")
        self.assertIn("PRICE_MISMATCH", resp_1["flags"])
        self.assertEqual(resp_1["inserted_count"], 10)
        self.assertEqual(resp_1["persisted_count"], 10)
        self.assertEqual(len(fake.rows), 10)
        # Verify all rows in DB initially have status needs_review
        self.assertTrue(all(r["status"] == "needs_review" for r in fake.rows))

        # Step 2: Second run with corrected, valid content (Giá 800.000đ matches sale_price)
        valid_rows = make_rows(full_kit_for_all=True)
        for r in valid_rows:
            r["caption"] = "Giá vé chỉ 800.000đ cực kỳ hấp dẫn dành cho mọi nhà! #DuLich"

        payload_2 = {"campaign_id": campaign_id, "records": valid_rows}
        with patch.dict("os.environ", {"CONTENTS_API_KEY": "k" * 40}), patch(
            "rag_api.get_supabase", return_value=fake
        ):
            req_2 = SaveCampaignContentsRequest.model_validate(payload_2)
            resp_2 = save_campaign_contents(req_2, x_api_key="k" * 40)

        # Database and API response must both be approved
        self.assertEqual(resp_2["status"], "approved")
        self.assertEqual(resp_2["flags"], [])
        self.assertEqual(resp_2["inserted_count"], 0)
        self.assertEqual(resp_2["updated_count"], 10)
        self.assertEqual(resp_2["persisted_count"], 10)
        # Exactly 10 rows in DB, no duplicates created
        self.assertEqual(len(fake.rows), 10)
        # Crucial check: DB rows must be updated to approved, NOT left as needs_review
        self.assertTrue(all(r["status"] == "approved" for r in fake.rows))
        # Content in DB must be updated
        self.assertTrue(all("800.000đ" in r["caption"] for r in fake.rows))


if __name__ == "__main__":
    unittest.main()
