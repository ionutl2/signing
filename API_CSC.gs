function save_certificate_selection(alias) {
  save('selected_certificate_alias', alias);
}
function get_download_link() {
  var link = get('signed_doc_link');
  if (!link) {
    Utilities.sleep(5000);
    link = get('signed_doc_link');
    if (!link) {
      throw 'Unable to get download link !';
    }
  }
  return link;
}
function get_certificate_choice_alias() {
  var r = get('selected_certificate_alias');
  var c = get('full_credentials_info');
  if (!r || !c) {
    Utilities.sleep(1000);
    r = get('selected_certificate_alias');
    c = get('full_credentials_info');
    if (!r || !c) {
      throw 'Select a certificate for signing !';
    }
  }
  for (i = 0; i < c.length; i++) {
    if (c[i].description.split(':')[1].trim() == r.trim()) {
      select_credential_for_signing(i);
      break;
    }
  }
  return r;
}

function get_certificate_array() {
  var certs = [];
  var c = get('full_credentials_info');
  if (!c) {
    Utilities.sleep(3000);
    c = get('full_credentials_info');
    if (!c)
      throw 'Unable to get avalaible credentials!'
  }
  for (i = 0; i < c.length; i++) {
    var tmp = {
      alias: c[i].description.split(':')[1],
      subiect: c[i].cert.subjectDN.split(',')[0].substring(3),
      emitent: c[i].cert.issuerDN.split(',')[0].substring(3),
      status: c[i].cert.status
    };
    Logger.log('Added: ' + tmp.alias);
    certs.push(JSON.stringify(tmp));
  }
  Logger.log('Return');
  return certs.join(';');
}

function savePIN_OTP(pin, otp, commitmenttype, claimedSignerRoles) {
  if (!pin)
    throw "No password set !";
  if (!otp)
    throw "No OTP set !";
  if (!commitmenttype)
    throw "No commitment type set";
  if (!claimedSignerRoles)
    throw "No signer roles set !";
  save('user_login_password', pin);
  save('credential_select_for_signing_OTP', otp);
  save('commitmenttype',commitmenttype);
  save('claimedSignerRoles', claimedSignerRoles);
}

function get_access_token() {
  var redirect_uri = ScriptApp.getService().getUrl();//.substring(0,ScriptApp.getService().getUrl().length - 4) + 'dev';
  var request_type = 'oauth2/token';
  var baseUrl = get('csc_url',true);
  var client_id = get('client_id',true);
  var client_secret = get('client_secret',true);
  var expire = get('exp_date');
  var cod = get('cod');
  if (!cod || !expire || expire - 500 < new Date().getTime()) {
    loginUI();
    throw 'Authentication code expired !';
    return;
  }
  var url = baseUrl + request_type;
  var post_data = {
    grant_type: 'authorization_code',
    code: cod,
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: redirect_uri
  };
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    method: 'post',
    payload: JSON.stringify(post_data)
  };
  //log(UrlFetchApp.getRequest(url, options));
  var response = JSON.parse(UrlFetchApp.fetch(url, options));
  //  OK   = {"access_token":"c9ea3181-770c-4e9a-bcb2-00753cd7309f","refresh_token":null,"token_type":"Bearer","expires_in":3600}
  //Error = {"error":"access_denied","error_description":"Invalid access_token"}
  var now = new Date();
  save('exp_date', now.getTime());
  if (response.error) {
    throw response.error_description;
  } else if (!response.access_token) {
    throw 'Invalid response from CSC API !';
  }
  save('access_token', response.access_token);
  save('access_token_expr', now.getTime() + response.expires_in * 1000);
}

function get_available_credential_info() {
  var request_type = 'credentials/list';
  var baseUrl = get('csc_url',true);  
  var url = baseUrl + request_type;
  var access_token = get('access_token');
  var access_token_expr = get('access_token_expr');
  if (!access_token || !access_token_expr || access_token_expr - 500 < new Date().getTime()) {
    Utilities.sleep(1000);
    access_token = get('access_token');
    access_token_expr = get('access_token_expr');
    if (!access_token || !access_token_expr || access_token_expr - 500 < new Date().getTime()) {
      loginUI();
      return;
    }
  }
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + access_token
    },
    method: 'post',
    payload: '{ }'
  };
  var credlist = JSON.parse(UrlFetchApp.fetch(url, options));
  //  OK   = {nextPageToken:null, credentialIDs:["DA484E5EDE1A76E6359954AED7B9852F26140B9B"]} ==> credlist.credentialIDs[0]
  //Error = {error:"access_denied", error_description:"Invalid access_token"}
  if (credlist.error) {
    log('get_available_credential_info:: Error (' + request_type + '): ' + credlist.error_description)
    throw credlist.error_description;
  } else if (!credlist.credentialIDs) {
    throw 'Invalid response from CSC API !';
  }
  request_type = 'credentials/info';
  url = baseUrl + request_type;
  var credentials = [];
  for (i = 0; i < credlist.credentialIDs.length; i++) {
    post_data = {
      credentialID: credlist.credentialIDs[i],
      certificates: 'chain',
      certInfo: 'true'
    };
    options = {
      muteHttpExceptions: true,
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + access_token
      },
      method: 'post',
      payload: JSON.stringify(post_data)
    };
    var credinfo = JSON.parse(UrlFetchApp.fetch(url, options));
    credentials.push(credinfo);
  }
  save('full_credentials_info', credentials);
  save('credential_IDs_list', credlist.credentialIDs);
}

function select_credential_for_signing(credentialIndex) {
  var request_type = 'credentials/sendOTP';
  var baseUrl = get('csc_url',true);
  var url = baseUrl + request_type;
  var credentials = get('full_credentials_info');
  var credentialIDs = get('credential_IDs_list');
  var access_token = get('access_token');
  if (!credentials || credentials.length - 1 < credentialIndex || !credentialIDs || !access_token) {
    Utilities.sleep(1000);
    credentials = get('full_credentials_info');
    credentialIDs = get('credential_IDs_list');
    access_token = get('access_token');
    if (!credentials || credentials.length - 1 < credentialIndex || !credentialIDs || !access_token) {
      throw 'Error selecting credential for signing !';
    }
  }
  var post_data = {
    credentialID: credentialIDs[credentialIndex]
  };
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + access_token
    },
    method: 'post',
    payload: JSON.stringify(post_data)
  };
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() == 200)
    save('selected_credential_ID', credentialIDs[credentialIndex]);
  else {    
    throw JSON.parse(response.getResponseText()).error_description;
  }
}
function sign_hash(document_blob) {
  if (!document_blob) {
    log('sign_hash:: No document received !');
    return;
  }
  var request_type = 'signatures/signHash';
  var baseUrl = get('csc_url',true);
  var url = baseUrl + request_type;
  var auth_raspuns = get('requested_SAD');
  var access_token = get('access_token');
  var hash = get('document_hash_for_signature');
  var selected_credential_ID = get('selected_credential_ID');
  
  hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.base64Decode(hash)));
  
  if (!auth_raspuns || !auth_raspuns.SAD) {
    Utilities.sleep(1000);
    if (!auth_raspuns || !auth_raspuns.SAD) {
      throw "Trying to sign without having SAD !";
    }
  }
  if (!access_token) {
    Utilities.sleep(1000);
    access_token = get('access_token');
    if (!access_token) {
      throw 'Trying to sign without access_token !';
    }
  }
  if (!hash) {
    Utilities.sleep(1000);
    hash = get('document_hash_for_signature');
    if (!hash) {
      throw 'Trying to sign without a hash !';
    }
  }
  if (!selected_credential_ID) {
    Utilities.sleep(1000);
    selected_credential_ID = get('selected_credential_ID');
    if (!selected_credential_ID) {
      throw 'Trying to sign without selecting a credential !';
    }
  }
  var post_data = {
    //sha256withRSA
    credentialID: selected_credential_ID,
    signAlgo: '1.2.840.113549.1.1.11', //RSA
    hashAlgo: '2.16.840.1.101.3.4.2.1', //SHA_256
    signAlgoParams: '',
    SAD: auth_raspuns.SAD,
    hash: [hash]
  };
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + access_token
    },
    method: 'post',
    payload: JSON.stringify(post_data)
  };
  var response = UrlFetchApp.fetch(url, options);
  response = JSON.parse(response);
  save('raspuns_sign', response);
  try {
    save('document_hash_signature_value', response.signatures[0]);
  } catch (e) {
    throw response.error_description;
  }
  DSSAPI_sign_document(document_blob);
}
function request_auth_SAD() {
  var request_type = 'credentials/authorize';
  var baseUrl = get('csc_url',true);
  var url = baseUrl + request_type;
  var access_token = get('access_token');
  var auth_password = get('user_login_password');
  var otp = get('credential_select_for_signing_OTP');
  var selected_credential_ID = get('selected_credential_ID');
  var pdf_file = SpreadsheetApp.getActive().getAs('application/pdf');
  DSSAPI_get_document_hash(pdf_file);
  var hash = get('document_hash_for_signature');
  if (!access_token) {
    Utilities.sleep(1000);
    access_token = get('access_token');
    if (!access_token) {
      throw 'Trying to request SAD without an access token !';
    }
  }
  if (!auth_password || !otp || !selected_credential_ID) {
    Utilities.sleep(1000);
    if (!auth_password || !otp || !selected_credential_ID) {
      throw 'Trying to request SAD without authentication pasword, OTP code or selecting a credential !';
    }
  }
  if (!hash) {
    Utilities.sleep(1000);
    hash = get('document_hash_for_signature');
    if (!hash) {
      throw 'Trying to request SAD without having the hash value!';
    }
  }
  hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.base64Decode(hash)));
  var post_data = {
    credentialID: selected_credential_ID,
    numSignatures: 1,
    hash: [hash],
    PIN: auth_password,
    OTP: otp
  };
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + access_token
    },
    method: 'post',
    payload: JSON.stringify(post_data)
  };
  var response = UrlFetchApp.fetch(url, options);
  var rcode = response.getResponseCode();
  if (rcode != 200) {
    //"{"error":"invalid_otp","error_description":"The OTP is invalid"}"???
    log('request_auth_SAD return code::' + rcode);
    throw JSON.parse(response).error_description;
  }
  response = JSON.parse(response);
  save('requested_SAD', response);
  sign_hash(pdf_file);
}