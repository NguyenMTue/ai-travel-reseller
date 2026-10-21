"""Regression tests for product claims in campaign content."""

import unittest
from unittest.mock import patch

from rag_api import (
    SaveCampaignContentsRequest,
    _guard_content,
    save_campaign_contents,
)


class GeneratedClaimGuardrailTests(unittest.TestCase):
    def setUp(self):
        self.vinwonders = {
            "original_price": 600_000,
            "sale_price": 510_000,
            "description": (
                "River Safari bằng thuyền, công viên nước, đảo dân gian "
                "và show diễn 3D Mapping Về Bến."
            ),
        }

    def test_unverified_package_inclusions_require_review(self):
        self.assertEqual(
            _guard_content("Vé VinWonders trọn gói chỉ 510.000đ.", self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )

    def test_generated_copy_cannot_claim_to_be_a_real_review(self):
        self.assertEqual(
            _guard_content("Review chân thực VinWonders Nam Hội An.", self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )

    def test_unverified_game_quantity_requires_review(self):
        self.assertEqual(
            _guard_content("Vô vàn trò chơi tại VinWonders.", self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )

    def test_claim_is_allowed_when_product_facts_verify_the_phrase(self):
        product = {
            **self.vinwonders,
            "description": "Vé trọn gói bao gồm vô vàn trò chơi.",
        }
        self.assertEqual(
            _guard_content("Vé trọn gói bao gồm vô vàn trò chơi.", product),
            [],
        )

    def test_unverified_trip_duration_requires_review(self):
        self.assertEqual(
            _guard_content("Tour Phong Nha 3 ngày đầy trải nghiệm.", self.vinwonders),
            ["UNVERIFIED_DURATION"],
        )

    def test_duration_is_allowed_when_present_in_product_facts(self):
        product = {
            **self.vinwonders,
            "verified_facts": ["Tour Phong Nha kéo dài 3 ngày 2 đêm."],
        }
        self.assertEqual(
            _guard_content("Tour Phong Nha 3 ngày 2 đêm.", product),
            [],
        )

    def test_unverified_activities_and_experience_quantity_requires_review(self):
        self.assertEqual(
            _guard_content("Vô vàn trải nghiệm tại VinWonders.", self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )
        self.assertEqual(
            _guard_content("Vô vàn hoạt động tại VinWonders.", self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )

    def test_single_day_duration_claim_requires_review(self):
        self.assertEqual(
            _guard_content("Khám phá VinWonders trong 1 ngày trọn vẹn.", self.vinwonders),
            ["UNVERIFIED_DURATION"],
        )

    def test_cost_and_price_assurances_require_product_facts(self):
        copy = "Giá đã được xác thực, không lo chi phí ẩn."
        self.assertEqual(
            _guard_content(copy, self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )

    def test_verified_facts_are_not_hidden_by_product_description(self):
        product = {
            **self.vinwonders,
            "verified_facts": ["Giá đã được xác thực; không lo chi phí ẩn."],
        }
        self.assertEqual(
            _guard_content("Giá đã được xác thực, không lo chi phí ẩn.", product),
            [],
        )

    def test_unverified_spaciousness_claim_requires_review(self):
        self.assertEqual(
            _guard_content("Không gian rộng lớn tại VinWonders Nam Hội An.", self.vinwonders),
            ["PROHIBITED_CLAIM"],
        )

    def test_spaciousness_allowed_when_present_in_product_facts(self):
        product = {
            **self.vinwonders,
            "verified_facts": ["Khuôn viên có không gian rộng lớn."],
        }
        self.assertEqual(
            _guard_content("Không gian rộng lớn tại VinWonders Nam Hội An.", product),
            [],
        )



class RetryEvidenceTests(unittest.TestCase):
    def test_retry_reports_zero_insertions_and_keeps_the_same_ids(self):
        campaign_id = "44444444-4444-4444-4444-444444444444"
        product_id = "33333333-3333-3333-3333-333333333333"

        class FakeQuery:
            def __init__(self, database, table):
                self.database = database
                self.table = table
                self.pending = None
                self.keys = None

            def select(self, *_columns):
                return self

            def eq(self, key, value):
                return self

            def maybe_single(self):
                return self

            def in_(self, key, values):
                self.keys = set(values)
                return self

            def upsert(self, rows, on_conflict=None, ignore_duplicates=False, **_options):
                self.pending = rows
                self.ignore_duplicates = ignore_duplicates
                return self

            def execute(self):
                if self.table == "campaigns":
                    return type("Result", (), {"data": {"id": campaign_id, "product_id": product_id}})()
                if self.table == "products":
                    return type("Result", (), {"data": {
                        "id": product_id,
                        "original_price": 600_000,
                        "sale_price": 510_000,
                        "description": "Vé vào cửa VinWonders Nam Hội An.",
                    }})()
                if self.pending is not None:
                    upserted = []
                    for row in self.pending:
                        match_idx = None
                        for i, saved in enumerate(self.database.rows):
                            if saved["generation_key"] == row["generation_key"]:
                                match_idx = i
                                break
                        if match_idx is not None:
                            if not getattr(self, "ignore_duplicates", False):
                                self.database.rows[match_idx] = {**self.database.rows[match_idx], **row}
                            upserted.append(self.database.rows[match_idx])
                        else:
                            saved = {**row, "id": f"content-{len(self.database.rows)}"}
                            self.database.rows.append(saved)
                            upserted.append(saved)
                    return type("Result", (), {"data": upserted})()
                saved = [
                    row for row in self.database.rows
                    if self.keys and row["generation_key"] in self.keys
                ]
                return type("Result", (), {"data": saved})()

        class FakeSupabase:
            def __init__(self):
                self.rows = []

            def table(self, table):
                return FakeQuery(self, table)

        records = []
        for index in range(10):
            row = {
                "persona": "family",
                "hook": f"Cùng khám phá VinWonders Nam Hội An qua góc nhìn gia đình số {index:02d}!",
            }
            if index < 5:
                row.update(
                    script=f"Kịch bản hành trình vui vẻ và đáng nhớ số {index:02d}.",
                    caption=f"Khám phá VinWonders Nam Hội An cùng gia đình số {index:02d}! #VinWonders",
                    cta=f"Đặt vé VinWonders ngay tại [LINK_MUA_VE] số {index:02d}.",
                )
            else:
                row.update(script=None, caption=None, cta=None)
            records.append(row)

        request = SaveCampaignContentsRequest(campaign_id=campaign_id, records=records)
        database = FakeSupabase()
        with patch.dict("os.environ", {"CONTENTS_API_KEY": "k" * 40}), patch(
            "rag_api.get_supabase", return_value=database
        ):
            first = save_campaign_contents(request, x_api_key="k" * 40)
            retry = save_campaign_contents(request, x_api_key="k" * 40)

        self.assertEqual(first["inserted_count"], 10)
        self.assertEqual(retry["inserted_count"], 0)
        self.assertEqual(first["content_ids"], retry["content_ids"])
        self.assertEqual(len(database.rows), 10)


if __name__ == "__main__":
    unittest.main()
