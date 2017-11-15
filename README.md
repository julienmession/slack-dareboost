# Dareboost automation

Automate Dareboost tests through multiple ways.

# Use as instant run script

1. Clone this repository of import it as a dependency in your package.json

2. Create a dareboost.json file at the root of your project directory, based on the [dareboost.json.sample](dareboost.json.sample) file.

3. Edit your Dareboost API token in `dareboost_api_token` and the list of the URLs you want to analyse in `urls`.

4. Run `node src/instant/index.js`
