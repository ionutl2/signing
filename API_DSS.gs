/* CommitmentTypes
ProofOfOrigin 1.2.840.113549.1.9.16.6.1
ProofOfReceipt 1.2.840.113549.1.9.16.6.2
ProofOfDelivery 1.2.840.113549.1.9.16.6.3
ProofOfSender 1.2.840.113549.1.9.16.6.4
ProofOfApproval 1.2.840.113549.1.9.16.6.5
ProofOfCreation 1.2.840.113549.1.9.16.6.6
*/
function DSSAPI_get_document_hash(document_blob) {
  if (!document_blob) {
    throw 'Trying to get signed properties without a valid document!';
  }
  var base64doc = Utilities.base64Encode(document_blob.getBytes());
  var url = get('dss_url', true) + '/one-document/getDataToSign';
  //url = "https://ec.europa.eu/cefdigital/DSS/webapp-demo/services/rest/signature/one-document/getDataToSign"; //Test EU demo app
  var commitmenttype = get('commitmenttype');
  if (typeof commitmenttype == 'string')
    commitmenttype = [];
  var claimedSignerRoles = get('claimedSignerRoles');
  var full_credentials_info = get('full_credentials_info');
  var selected_certificate_alias = get('selected_certificate_alias');
  if (!full_credentials_info || !selected_certificate_alias || !claimedSignerRoles || !commitmenttype) {
    Utilities.sleep(1000);
    full_credentials_info = get('full_credentials_info');
    selected_certificate_alias = get('selected_certificate_alias');
    claimedSignerRoles = get('claimedSignerRoles');
    commitmenttype = get('commitmenttype');
    if (!full_credentials_info || !selected_certificate_alias || !claimedSignerRoles || !commitmenttype) {
      throw 'Trying to get signed properties without proper credentials!';
    }
  }
  var selected_certificate_encoded = '';
  var selected_certificate_chain_encoded = [];
  try {
    for (i = 0; i < full_credentials_info.length; i++) {
      if (full_credentials_info[i].description.split(':')[1].trim() == selected_certificate_alias.trim()) {
        selected_certificate_encoded = full_credentials_info[i].cert.certificates[0]; 
        selected_certificate_chain_encoded.push({encodedCertificate: full_credentials_info[i].cert.certificates[1]});
        selected_certificate_chain_encoded.push({encodedCertificate: full_credentials_info[i].cert.certificates[2]});
      }
    }
  } catch (e) {
    throw 'Trying to get signed properties with an invalid certificate alias!';
  }
  var signing_date = new Date().getTime();
  save('signing_date', signing_date);
  var post_data = {
    parameters: {
      signWithExpiredCertificate: true,
      generateTBSWithoutCertificate: true,
      signatureLevel: "PAdES_BASELINE_B",
      signaturePackaging: "ENVELOPED",
      signatureAlgorithm: "RSA_SHA256",
      encryptionAlgorithm: "RSA",
      digestAlgorithm: "SHA256",
      referenceDigestAlgorithm: null,
      maskGenerationFunction: null,
      contentTimestampParameters: {
        digestAlgorithm: "SHA256",
        canonicalizationMethod: "http://www.w3.org/2001/10/xml-exc-c14n#"
      },
      signatureTimestampParameters: {
        digestAlgorithm: "SHA256",
        canonicalizationMethod: "http://www.w3.org/2001/10/xml-exc-c14n#"
      },
      archiveTimestampParameters: {
        digestAlgorithm: "SHA256",
        canonicalizationMethod: "http://www.w3.org/2001/10/xml-exc-c14n#"
      },
      signingCertificate: {
        //encodedCertificate: "MIIFpTCCBI2gAwIBAgIIH4WI0cyFV1cwDQYJKoZIhvcNAQELBQAwdDELMAkGA1UEBhMCUk8xFzAVBgNVBAoTDlRyYW5zIFNwZWQgU1JMMR8wHQYDVQQLExZGT1IgVEVTVCBQVVJQT1NFUyBPTkxZMSswKQYDVQQDEyJUcmFucyBTcGVkIE1vYmlsZSBlSURBUyBRQ0EgLSBURVNUMB4XDTE5MDEyMzE1MzYxNFoXDTIwMDEyMzE1MzYxNFowgYoxCzAJBgNVBAYTAlJPMRIwEAYDVQQEEwlMdWN1bGVzY3UxDjAMBgNVBCoTBUlvbnV0MT0wOwYDVQQFEzQyMDA0MTIyMzRMSTA5NDlBQ0VDNkM5NjFEMERBN0Y1NTU3QTA5MkFGRjFFMUJDQUU2NTRCMRgwFgYDVQQDEw9Jb251dCBMdWN1bGVzY3UwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCJsUdu+d/5iqvS1JRWWoD25oyvK6MOChVZhRyKrXYFOZgCSw+obkqAzLa2LJ3MiuBLq0A4/kbhK9tdTehNZohoh7bcmondd45DEZMRZt8BNRVxDKhnTWJg85FtK7z0w47tmnwAFxO1vw749exPF4RPWbiV7l5bVvIfc1Z+8PEyvFwC2wew2t76GwQx5nirgloW7Endc9hSiKp2FfFM95dr0PBfObpComIppO4CsETUqZvuNWRj/rlXR2MTFXYCvC+Tym1gcnXLyTPJ2/z7UyUY1ijrOGPkZVd7tIRjm50tmwgk7RenNZ665vNu53RI80Z8pkHO5UUfuNIIicfMHgofAgMBAAGjggIiMIICHjCBhAYIKwYBBQUHAQEEeDB2MEgGCCsGAQUFBzAChjxodHRwOi8vd3d3LnRyYW5zc3BlZC5yby9jYWNlcnRzL3RzX21vYmlsZV9laWRhc19xY2FfdGVzdC5wN2MwKgYIKwYBBQUHMAGGHmh0dHA6Ly9vY3NwLXRlc3QudHJhbnNzcGVkLnJvLzAdBgNVHQ4EFgQUwz/2DQTHeur+7OXAibJ2H3IXpU4wDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBQK8YBH5MRRgdQqjMaVbemLc7UEzDBQBggrBgEFBQcBAwREMEIwCAYGBACORgEBMAgGBgQAjkYBBDAsBgYEAI5GAQUMImh0dHA6Ly93d3cudHJhbnNzcGVkLnJvL3JlcG9zaXRvcnkwVQYDVR0gBE4wTDAJBgcEAIvsQAECMD8GCysGAQQBgrgdBAEBMDAwLgYIKwYBBQUHAgEWImh0dHA6Ly93d3cudHJhbnNzcGVkLnJvL3JlcG9zaXRvcnkwSQYDVR0fBEIwQDA+oDygOoY4aHR0cDovL3d3dy50cmFuc3NwZWQucm8vY3JsL3RzX21vYmlsZV9laWRhc19xY2FfdGVzdC5jcmwwDgYDVR0PAQH/BAQDAgbAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDBDAkBgNVHREEHTAbgRlpb251dC5sdWN1bGVzY3VAZ21haWwuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQAsQhZ6kbqwADU/IWZviv4Zy3vsa9wltTp7gHVhNABMjaXGEHD4wlGjBLROD2YlMm8Nt02GgYG53hEeWYt0tcELDEW6TgvFw/i78Nlmk8u9n99FURfbI5zSPHHiWUTo02wpnkZpqfVAt5idZclf9g9l5u6oXT5NUx6hFJ0lukP//hjE1Qgr5QaM27k8cq8+MxoEAqqdDGtQQ2Rzb2ZAinjr1zWlaBL9/77+OxVtJ66aKBIlp8m7hiArJDGTVuf2v6hOtLPzPadAY2NUI4PJwgW44f9zjwq9IVcVK8zNgxc6qHdjtdhEGyexCJ5I/SehipQluhUErtOVUfrHVYDGtep/"
        encodedCertificate: selected_certificate_encoded
      },
      certificateChain: selected_certificate_chain_encoded,
      detachedContents: null,
      asicContainerType: null,
      blevelParams: {
        trustAnchorBPPolicy: false,//
        signingDate: signing_date,
        claimedSignerRoles: claimedSignerRoles,//
        signaturePolicy: null,
        commitmentTypeIndications: commitmenttype,
        signerLocation: null
      }
    },
    toSignDocument: {
      bytes: base64doc,
      digestAlgorithm: null,
      name: document_blob.getName(),
      mimeType: null
    }
  };
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    method: 'post',
    payload: JSON.stringify(post_data)
  };
  var to_sign_data = UrlFetchApp.fetch(url, options);
  var content = to_sign_data.getContentText();
  var response_code = to_sign_data.getResponseCode();
  if (response_code != 200) {
    throw content;
  }
  content = JSON.parse(content);
  try {
    save('document_hash_for_signature', content.bytes);
  } catch (e) {
    throw 'Invalid response from DSS API!';
  }
}

function DSSAPI_sign_document(document_blob) {
  if (!document_blob) {
    throw 'Trying to sign an invalid document!';
  }
  var base64doc = Utilities.base64Encode(document_blob.getBytes());
  var document_hash_signature_value = get('document_hash_signature_value');
  if (!document_hash_signature_value) {
    Utilities.sleep(1000);
    document_hash_signature_value = get('document_hash_signature_value');
    if (!document_hash_signature_value) {
      throw 'Trying to sign without having the hash value!';
    }
  }
  var full_credentials_info = get('full_credentials_info');
  var selected_certificate_alias = get('selected_certificate_alias');
  var commitmenttype = get('commitmenttype');
  var claimedSignerRoles = get('claimedSignerRoles');
  if (!full_credentials_info || !selected_certificate_alias || !commitmenttype || !claimedSignerRoles) {
    Utilities.sleep(1000);
    full_credentials_info = get('full_credentials_info');
    selected_certificate_alias = get('selected_certificate_alias');
    commitmenttype = get('commitmenttype');
    claimedSignerRoles = get('claimedSignerRoles');
    if (!full_credentials_info || !selected_certificate_alias || !commitmenttype || !claimedSignerRoles) {      
      throw 'Trying to sign without having the proper credentials saved!';
    }
  }
  var selected_certificate_encoded = '';
  var selected_certificate_chain_encoded = [];
  try {
    for (i = 0; i < full_credentials_info.length; i++) {
      if (full_credentials_info[i].description.split(':')[1].trim() == selected_certificate_alias.trim()) {
        selected_certificate_encoded = full_credentials_info[i].cert.certificates[0];
        selected_certificate_chain_encoded.push({encodedCertificate: full_credentials_info[i].cert.certificates[1]});
        selected_certificate_chain_encoded.push({encodedCertificate: full_credentials_info[i].cert.certificates[2]});
        //save('debug_selected_certificate_encoded', selected_certificate_encoded);
      }
    }
  } catch (e) {
    throw 'Trying to sign with an invalid certificate alias!';
  }
  var signing_date = get('signing_date');
  if (!signing_date) {
    Utilities.sleep(1000);
    signing_date = get('signing_date');
    if (!signing_date) {
      throw 'Trying to sign without having the signing time saved!';
    }
  }
  var post_data = {
    parameters: {
      signWithExpiredCertificate: true,
      generateTBSWithoutCertificate: true,
      signatureLevel: "PAdES_BASELINE_B",
      signaturePackaging: "ENVELOPED",
      signatureAlgorithm: "RSA_SHA256",
      encryptionAlgorithm: "RSA",
      digestAlgorithm: "SHA256",
      referenceDigestAlgorithm: null,
      maskGenerationFunction: null,
      contentTimestampParameters: {
        digestAlgorithm: "SHA256",
        canonicalizationMethod: "http://www.w3.org/2001/10/xml-exc-c14n#"
      },
      signatureTimestampParameters: {
        digestAlgorithm: "SHA256",
        canonicalizationMethod: "http://www.w3.org/2001/10/xml-exc-c14n#"
      },
      archiveTimestampParameters: {
        digestAlgorithm: "SHA256",
        canonicalizationMethod: "http://www.w3.org/2001/10/xml-exc-c14n#"
      },
      signingCertificate: {
        //encodedCertificate: "MIIFpTCCBI2gAwIBAgIIH4WI0cyFV1cwDQYJKoZIhvcNAQELBQAwdDELMAkGA1UEBhMCUk8xFzAVBgNVBAoTDlRyYW5zIFNwZWQgU1JMMR8wHQYDVQQLExZGT1IgVEVTVCBQVVJQT1NFUyBPTkxZMSswKQYDVQQDEyJUcmFucyBTcGVkIE1vYmlsZSBlSURBUyBRQ0EgLSBURVNUMB4XDTE5MDEyMzE1MzYxNFoXDTIwMDEyMzE1MzYxNFowgYoxCzAJBgNVBAYTAlJPMRIwEAYDVQQEEwlMdWN1bGVzY3UxDjAMBgNVBCoTBUlvbnV0MT0wOwYDVQQFEzQyMDA0MTIyMzRMSTA5NDlBQ0VDNkM5NjFEMERBN0Y1NTU3QTA5MkFGRjFFMUJDQUU2NTRCMRgwFgYDVQQDEw9Jb251dCBMdWN1bGVzY3UwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCJsUdu+d/5iqvS1JRWWoD25oyvK6MOChVZhRyKrXYFOZgCSw+obkqAzLa2LJ3MiuBLq0A4/kbhK9tdTehNZohoh7bcmondd45DEZMRZt8BNRVxDKhnTWJg85FtK7z0w47tmnwAFxO1vw749exPF4RPWbiV7l5bVvIfc1Z+8PEyvFwC2wew2t76GwQx5nirgloW7Endc9hSiKp2FfFM95dr0PBfObpComIppO4CsETUqZvuNWRj/rlXR2MTFXYCvC+Tym1gcnXLyTPJ2/z7UyUY1ijrOGPkZVd7tIRjm50tmwgk7RenNZ665vNu53RI80Z8pkHO5UUfuNIIicfMHgofAgMBAAGjggIiMIICHjCBhAYIKwYBBQUHAQEEeDB2MEgGCCsGAQUFBzAChjxodHRwOi8vd3d3LnRyYW5zc3BlZC5yby9jYWNlcnRzL3RzX21vYmlsZV9laWRhc19xY2FfdGVzdC5wN2MwKgYIKwYBBQUHMAGGHmh0dHA6Ly9vY3NwLXRlc3QudHJhbnNzcGVkLnJvLzAdBgNVHQ4EFgQUwz/2DQTHeur+7OXAibJ2H3IXpU4wDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBQK8YBH5MRRgdQqjMaVbemLc7UEzDBQBggrBgEFBQcBAwREMEIwCAYGBACORgEBMAgGBgQAjkYBBDAsBgYEAI5GAQUMImh0dHA6Ly93d3cudHJhbnNzcGVkLnJvL3JlcG9zaXRvcnkwVQYDVR0gBE4wTDAJBgcEAIvsQAECMD8GCysGAQQBgrgdBAEBMDAwLgYIKwYBBQUHAgEWImh0dHA6Ly93d3cudHJhbnNzcGVkLnJvL3JlcG9zaXRvcnkwSQYDVR0fBEIwQDA+oDygOoY4aHR0cDovL3d3dy50cmFuc3NwZWQucm8vY3JsL3RzX21vYmlsZV9laWRhc19xY2FfdGVzdC5jcmwwDgYDVR0PAQH/BAQDAgbAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDBDAkBgNVHREEHTAbgRlpb251dC5sdWN1bGVzY3VAZ21haWwuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQAsQhZ6kbqwADU/IWZviv4Zy3vsa9wltTp7gHVhNABMjaXGEHD4wlGjBLROD2YlMm8Nt02GgYG53hEeWYt0tcELDEW6TgvFw/i78Nlmk8u9n99FURfbI5zSPHHiWUTo02wpnkZpqfVAt5idZclf9g9l5u6oXT5NUx6hFJ0lukP//hjE1Qgr5QaM27k8cq8+MxoEAqqdDGtQQ2Rzb2ZAinjr1zWlaBL9/77+OxVtJ66aKBIlp8m7hiArJDGTVuf2v6hOtLPzPadAY2NUI4PJwgW44f9zjwq9IVcVK8zNgxc6qHdjtdhEGyexCJ5I/SehipQluhUErtOVUfrHVYDGtep/"
        encodedCertificate: selected_certificate_encoded
      },
      certificateChain: selected_certificate_chain_encoded,
      detachedContents: null,
      asicContainerType: null,
      blevelParams: {
        trustAnchorBPPolicy: false,
        signingDate: signing_date,
        claimedSignerRoles: claimedSignerRoles,
        signaturePolicy: null,
        commitmentTypeIndications: commitmenttype,
        signerLocation: null
      }
    },
    signatureValue: {
      algorithm: "RSA_SHA256",
      value: document_hash_signature_value
    },
    toSignDocument: {
      bytes: base64doc,
      digestAlgorithm: null,
      name: document_blob.getName(),
      mimeType: null
    }
  };
  var options = {
    muteHttpExceptions: true,
    contentType: 'application/json',
    method: 'post',
    payload: JSON.stringify(post_data)
  };
  var url = get('dss_url', true) + "/one-document/signDocument";
  var signed_document = UrlFetchApp.fetch(url, options);
  content = signed_document.getContentText();
  response_code = signed_document.getResponseCode();
  if (response_code != 200) {
    throw content;
  }
  try {
    content = JSON.parse(content);
    var signed_pdf_blob = Utilities.newBlob(Utilities.base64Decode(content.bytes), content.mimeType.mimeTypeString, content.name);
    save_document(signed_pdf_blob);
  } catch (e) {
    throw 'Trying to sign and got an invalid response from the DSS API!';
  }
}
