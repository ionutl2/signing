function onInstall() {
  onOpen();
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('Signatures');
  menu.addItem('Add new', 'loginUI');
  menu.addItem('View all', 'versionUI');
  menu.addSeparator();
  menu.addItem('Setup', 'show_setup');
  menu.addItem('About', 'show_about');
  menu.addToUi();
}
function show_setup() {
  var ui = SpreadsheetApp.getUi();
  ui.showModalDialog(HtmlService.createHtmlOutputFromFile('UI_client_settings'), 'Add-on parameters');
}
function show_about() {
  var ui = SpreadsheetApp.getUi();
}

function loop_change_login_cert() {
  while (true) {
    if (get('full_credentials_info'))
      break;
    Utilities.sleep(3000);
  }
  certificate_UI();
}
function versionUI() {
  var html = HtmlService.createHtmlOutputFromFile('UI_client_versions');
  var ui = SpreadsheetApp.getUi();
  html.setTitle('Signed versions');
  ui.showSidebar(html);
}
function loginUI(debug) {
  var ui = SpreadsheetApp.getUi();
  var client_id = get('client_id',true);
  var client_secret = get('client_secret',true);
  var response_type = 'token';
  var redirect_uri = ScriptApp.getService().getUrl();//.substring(0,ScriptApp.getService().getUrl().length - 4) + 'dev';//ScriptApp.getService().getUrl();
  var request_type = 'oauth2/authorize';
  var baseUrl = get('csc_url',true);
  var template = HtmlService.createTemplateFromFile('UI_client_login');
  template.url = baseUrl + request_type + '?client_id=' + client_id + '&client_secret=' +
    client_secret + '&response_type=' + response_type + '&redirect_uri=' + redirect_uri;  
  template.redirect = ScriptApp.getService().getUrl().substring(0,ScriptApp.getService().getUrl().length - 4) + 'dev';
  ui.showSidebar(template.evaluate().setTitle('Sign document:'));
  PropertiesService.getUserProperties().deleteAllProperties();
  clearlog();
}
function close_win() {
  var html = HtmlService.createHtmlOutput("<script>google.script.host.close();</script>").setTitle('Closing ...');
  SpreadsheetApp.getUi().showSidebar(html);
}

function certificate_UI() {

  var ui = SpreadsheetApp.getUi();
  ui.showSidebar(HtmlService.createHtmlOutputFromFile('UI_client_certificates').setTitle('Available certificates'));
}
