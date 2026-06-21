import unittest

from qa_utils import (
    analyze_agent_quality,
    analyze_customer_sentiment,
    build_score_explanations,
    safe_score,
)


class QaUtilsTest(unittest.TestCase):
    def test_safe_score_scales_five_point_values(self):
        self.assertEqual(safe_score(4), 80)
        self.assertEqual(safe_score(105), 100)
        self.assertEqual(safe_score("bad", 72), 72)

    def test_agent_quality_detects_fillers_and_courtesy(self):
        result = analyze_agent_quality("Hello, um, I am sorry and happy to help.")

        self.assertEqual(result["fillers"], 1)
        self.assertGreaterEqual(result["courtesyWords"], 2)
        self.assertGreater(result["professionalism"], 70)

    def test_customer_sentiment_detects_frustration(self):
        result = analyze_customer_sentiment("I am angry, frustrated, and upset. This is terrible.")

        self.assertTrue(result["frustration"])
        self.assertLess(result["satisfaction"], 70)

    def test_explanations_include_talk_balance_reason(self):
        explanations = build_score_explanations(
            greeting=80,
            professionalism=80,
            empathy=80,
            resolution=80,
            clarity=85,
            talk_balance=50,
            efficiency=80,
            agent_quality={"fillers": 0, "empathyPhrases": 1},
            customer_sentiment={"frustration": False},
            agent_talk_ratio=82,
            gemini_result={},
        )

        self.assertIn("82.0%", explanations["talkBalance"])


if __name__ == "__main__":
    unittest.main()
