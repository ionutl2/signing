function doGet(request) {
  var store = PropertiesService.getUserProperties();
  var timeout = 180; //seconds
  var now = new Date();
  var expr = new Date(now.getTime() + timeout * 1000);
  store.deleteAllProperties();
  if (request.parameters.code) {
    var cod = request.parameters.code.toString();
    var state = request.parameters.state;
    log('Got code : ' + cod);
    log('Got state :' + state);
    log('At : ' + now);
    save('cod', cod);
    save('state', state);
    save('exp_date', expr.getTime());
    try {
      get_access_token();
    } catch (e) {
      return HtmlService.createHtmlOutput('<center> <em>19<strong>' + e + '</strong> <br> You can now close the window.</em></center>');
    }
    if (get('access_token')) {
      try {
        get_available_credential_info();
      } catch (e) {
        return HtmlService.createHtmlOutput('<center> <em>25<strong>' + e + '</strong> <br> You can now close the window.</em></center>');
      }
    } else {
      return HtmlService.createHtmlOutput('<center> <em><strong> CSC API Error (token)!</strong> <br> You can now close the window.</em></center>');
    }
    if (!get('full_credentials_info'))
      return HtmlService.createHtmlOutput('<center> <em><strong> CSC API Error (certificate)!</strong> <br> You can now close the window.</em></center>');  
    return HtmlService.createHtmlOutput('<center> <em><strong> Succes !</strong> <br> You can now close the window.</em></center> <script>window.top.close();</script>');
  } else {
    return HtmlService.createHtmlOutput('<center> <em><strong> Authentication error !</strong> <br> You can now close the window.</em></center>');
  }
}

function log(mesaj) {
  var l = CacheService.getScriptCache().get('mylog');
  if (l)
    l += '\r\n' + new Date() + '---' + mesaj;
  else
    l = '\r\n' + new Date() + '---' + mesaj;
  CacheService.getScriptCache().put('mylog', l);
}

function clearlog() {
  CacheService.getScriptCache().remove('mylog');
  //Logger.clear();
}

function getlog() {
  return CacheService.getScriptCache().get('mylog');
}

function save(nume, valoare, toDocumentProp) {
  if (!nume || !valoare) {
    log('save without required param!');
    return;
  }
  if (Array.isArray(valoare)) {
    var v = [];
    for (var i = 0; i < valoare.length; i++) {
      if (typeof valoare[i] == 'object')
        v.push(JSON.stringify(valoare[i]));
      else
        v.push(valoare[i]);
    }
    v.push("DummyLastElement");
    v.push("DummyLastElement");
    valoare = v.join('///');
  } else if (typeof valoare == 'object') {
    try {
      valoare = JSON.stringify(valoare);
    } catch (eroare) {}
  } else if (typeof valoare != 'string')
    valoare = valoare.toString();
  if (!toDocumentProp)
    PropertiesService.getUserProperties().setProperty(nume, valoare);
  else
    PropertiesService.getDocumentProperties().setProperty(nume, valoare);
}

function get(nume, toDocumentProp) {
  if (!nume) {
    log('get without required param!');
    return;
  }
  if (!toDocumentProp)
    var valoare = PropertiesService.getUserProperties().getProperty(nume);
  else
    var valoare = PropertiesService.getDocumentProperties().getProperty(nume);
  if (!valoare) {
    //log(new Date() + ' === get:: variable ' + nume + ' is not saved!');
    return;
  }
  if (valoare.length <= 16) 
    try {
      var f_valoare = parseFloat(valoare);
      if (!isNaN(f_valoare) &&                         
         f_valoare.toString().length == valoare.length)
      {
        return f_valoare;
      }
    } catch (e) {}
  if (valoare.indexOf('///') != -1) {    
    valoare = valoare.split('///');
    var v = []
    for (var i = 0; i < valoare.length; i++) {
      if (typeof valoare[i] == 'string' && valoare[i].indexOf('{') != -1)
        valoare[i] = JSON.parse(valoare[i]);
      if (valoare[i] != 'DummyLastElement')
        v.push(valoare[i])
    }
    valoare = v;
  } else if (typeof valoare == 'string' && valoare.indexOf('{') != -1)
    valoare = JSON.parse(valoare)
  return valoare;
}
function del(nume, fromDocumentProp) {
  if (!nume) {
    log('del without required param!');
    return;
  }
  if (!fromDocumentProp)
     var valoare = PropertiesService.getUserProperties().getProperty(nume);
   else
     var valoare = PropertiesService.getDocumentProperties().getProperty(nume);
  if (!valoare) {
     log(new Date() + ' === del:: variable ' + nume + ' is not saved yet!');
     throw 'Unable to delete ' + nume;
  }
  if (!fromDocumentProp)
    PropertiesService.getUserProperties().deleteProperty(nume);
  else
    PropertiesService.getDocumentProperties().deleteProperty(nume);
  log(new Date() + ' === del:: variable ' + nume + ' was deleted!');
}
function save_document(blob) {
  if (!blob) {
    log('save_document:: without parameter!');
    throw 'Saving the document failed !';
  }
  var folder = DriveApp.getRootFolder().getFoldersByName('.Document_semnate');
  if (folder.hasNext())
    folder = folder.next();
  else
  {
    DriveApp.getRootFolder().createFolder('.Document_semnate');
    folder = DriveApp.getRootFolder().getFoldersByName('.Document_semnate').next();
  }
  var new_pdf = folder.createFile(blob);
  save('signed_doc_link', 'https://drive.google.com/file/d/' + new_pdf.getId() + '/view');
  var signing_date = get('signing_date');
  if (!signing_date) {
    Utilities.sleep(1000);
    signing_date = get('signing_date');
    if (!signing_date) {
      log('save_document:: signing_date is not saved!');
      throw 'Saving the document failed !';
    }
  }
  var signing_alias = get('selected_certificate_alias');
  if (!signing_alias) {
    Utilities.sleep(2000);
    signing_alias = get('selected_certificate_alias');
    if (!signing_alias)
      throw 'Saving the document failed !';
  }
  var signed_versions_info = get('signed_versions_info', true); //get from doc
  if (!signed_versions_info)
    signed_versions_info = [];
  var current_signature_info = {
    file_id: new_pdf.getId(),
    sign_date: signing_date,
    file_url: new_pdf.getUrl(),
    cert_alias: signing_alias
  };
  signed_versions_info.push(current_signature_info);
  save('signed_versions_info', signed_versions_info, true); //save to doc
  return new_pdf;
}
function get_version_array() {
  var signed_versions_info = get('signed_versions_info', true);
  if (!signed_versions_info) {
    Utilities.sleep(3000);
    signed_versions_info = get('signed_versions_info', true);
    if (!signed_versions_info)
      throw 'No signed versions available!';
  }
  var r = [];
  if (!signed_versions_info[0].sign_date || !signed_versions_info[0].file_id || !signed_versions_info[0].cert_alias)
  {
    del('signed_versions_info', true);
    throw 'No signed versions available!';
  }
  for (i = 0; i < signed_versions_info.length; i++) {
    var time = new Date(signed_versions_info[i].sign_date);
    var time_s = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();
    var av = '';
    var vl = '';
    var dl = '';
    try {
      DriveApp.getFileById(signed_versions_info[i].file_id);
      av = '&#9989'; //ok
      vl = 'https://drive.google.com/file/d/' + signed_versions_info[i].file_id + '/view';
      dl = 'https://drive.google.com/uc?export=download&id=' + signed_versions_info[i].file_id;
    } catch (e) {
      av = '&#10060'; //not ok
      vl = dl = '#';
    }
    var t = {
      sign_date: time_s,
      cert: signed_versions_info[i].cert_alias,
      view_link: vl,
      down_link: dl,
      available: av,
      id: signed_versions_info[i].file_id
    };
    r.push(t);
  }
  return r;
}
function delete_file(id) {
  //log ('id = ' + id);
  Drive.Files.remove(id);
}
function delete_version_info(fileID) {
  Utilities.sleep(1000);
  if (!fileID) {
    log ('delete_version_info: no fileID set!');
    throw 'Unable to delete requested signed version!';
  }
  var signed_versions_info = get('signed_versions_info', true);
  if (!signed_versions_info) {
    Utilities.sleep(3000);
    signed_versions_info = get('signed_versions_info', true);
    if (!signed_versions_info)
      throw 'No signed versions available!';
  }
  var new_versions = [];
  for (i = 0; i < signed_versions_info.length; i++) {
    if (signed_versions_info[i].file_id != fileID)
      new_versions.push(signed_versions_info[i]);
    else {
      try {
      //log ('id = ' + signed_versions_info[i].file_id);
      Drive.Files.remove(signed_versions_info[i].file_id);
      } catch (e) { log(e); }
    }
  }
  save('signed_versions_info', new_versions, true);
  return fileID;
}
function save_settings(client_id,client_secret,csc_url,dss_url) {
  if (client_id)
    save('client_id', client_id, true);
  if (client_secret)
    save('client_secret', client_secret, true);
  if (csc_url)
    save('csc_url', csc_url, true);
  if (dss_url)
    save('dss_url', dss_url, true);
}
function get_settings() {
  var client_id = get('client_id', true);
  var client_secret = get('client_secret', true);
  var csc_url = get('csc_url', true);
  var dss_url = get('dss_url', true);
  if (!client_id || !client_secret || !csc_url || !dss_url)
    throw 'Settings unavailable!';
  return {
    client_id: client_id,
    client_secret: client_secret,
    csc_url: csc_url,
    dss_url: dss_url,
    redirect_url: ScriptApp.getService().getUrl()
  };
}


