function test_save_get() {
  clearlog();
  var a = {
    aaa: 'aaasda',
    bbb: 'bbbaa',
    ccc: true,
    ddd: {
      eee: 1,
      fff: 'fffssss'
    }
  };
  var b = 'DA484E5EDE1A76E6359954AED7B9852F26140B9B';
  var c = 232;
  var d = 232.21;
  var e = '62hhy0';
  save('a1', a);
  save('a2', [a]);
  save('b1', b);
  save('b2', [b]);
  save('c1', c);
  save('c2', [c]);
  save('d1', d);
  save('d2', [d]);
  save('e', e);
  var a1 = get('a1');
  var a2 = get('a2');
  var b1 = get('b1');
  var b2 = get('b2');
  var c1 = get('c1');
  var c2 = get('c2');
  var d1 = get('d1');
  var d2 = get('d2');
  var e1 = get('e');

  var l = getlog();
  var j = '1';
  Logger.clear();
  Logger.log(l);
}
function clear_signed_versions() {
  PropertiesService.getDocumentProperties().deleteAllProperties();
}
function showlog()
{
  Logger.clear();
  Logger.log(getlog());
  clearlog();
}
function reset_settings()
{
  save('client_id', 'exampleID', true);
  save('client_secret', 'exampleSECRET', true);
  save('csc_url', 'https://example.com/csc/v0/', true);
  save('dss_url', 'http://example.com/services/rest/signature', true);
}





