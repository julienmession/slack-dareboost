# Dareboost automation

Automate Dareboost tests through multiple ways.

# Use as instant run script

1. Clone this repository of import it as a dependency in your package.json

2. Create a dareboost.json file at the root of your project directory, based on the [dareboost.json.sample](dareboost.json.sample) file (the following section will explain how to set up the analysis).

3. Run `DAREBOOST_API_TOKEN=XXXX node src/instant/index.js`

# Configuration

The analysis have to be configured using the dareboost.json file.

You can configure your analysis with shared and individuals settings.

Every setting should follow the one described in the [Dareboost API](https://www.dareboost.com/fr/documentation-api#analyse).
Shared settings must be located under the `analysis.shared` key, and each individual settings must be located as a dedicated object of the array located under the `analysis.list` key.

Note that the individual settings will overtake the shared ones.
