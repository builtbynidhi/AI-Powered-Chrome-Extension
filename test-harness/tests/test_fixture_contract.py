from pathlib import Path


def test_fixture_contains_supported_workday_signals():
    html = (Path(__file__).parents[1] / "fixtures" / "workday_my_information.html").read_text()
    assert 'role="main"' in html
    assert "My Information" in html
    assert "Month" in html and "Day" in html and "Year" in html
    assert 'role="radiogroup"' in html
