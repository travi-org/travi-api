Feature: api docs

    Scenario: html documentation
        When the documentation is requested in the browser
        Then the documentation should be viewable in the browser

    Scenario: top-level end-points
        When the docs are requested
        Then the top-level endpoints should be included

    Scenario: GET by id present for the top-level lists
        When the docs are requested
        Then the GET by id endpoints should be included