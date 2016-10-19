# fhir-capacity-app

This project uses [yo angular generator](https://github.com/yeoman/generator-angular) version 0.11.1.

## Build & development
This project assumes that `bower`, `npm` and `grunt` are installed.

Download dependencies by running `bower install && npm install`.


Run `grunt build` for building and `grunt serve` to run a web server on `localhost:9000`. 

The application requires two config files to be present in the project root, one for development `config_development.json` and one for production `config_production.json`.  The files looks like follows:

```json
{
  "apiUser": "YOUR_API_USER",
  "apiKey": "YOUR_API_KEY",
  "url": "YOUR_API_BACKEND_ENDPOINT",
  "oauthClientId": "YOUR_AUTHENTICATION_ID",
  "oauthRedirectUri": "YOUR_URL/#/oauth_callback"
}
```


