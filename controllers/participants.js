const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { json } = require('express');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

sgClient.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

loginAdmin = async() => {

    try {

        console.log(`${new Date().toUTCString()} loginAdmin`);

        const options = {
            method: 'POST',
            headers: {
                'X-Parse-Application-Id': `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": process.env.ADMIN_USERNAME,
                "password": process.env.ADMIN_PASSWORD
            })
        }

        const url = `${process.env.SERVER_URL}/login`;
        console.log(url)

        const response = await fetch(url, options);
        if(!response.ok) {
            console.log(`${new Date().toUTCString()} loginAdmin error`);
            return {error: "error"};
        }

        const body = await response.json(); 
        return body.sessionToken;
        
    } catch(error) {
        console.log(`${new Date().toUTCString()} loginAdmin exception`);
        console.log(error);
        return {error};
    }

}

getSendgridContactList = async() => {

    console.log(`${new Date().toUTCString()} getSendgridContactList`);

    try {
        const requestList = {
            method: 'GET',
            url: '/v3/marketing/lists'
        };
        let [response, body] = await sgClient.request(requestList)
    
        if(response.statusCode != 200) {
            console.log(`${new Date().toUTCString()} getSendgridContactList Error getting lists!`);
            return {error: "Error getting lists!"};
        }
    
        const consentList = body.result.find(element => element.name ===  process.env.CONTACT_LIST_NAME); 
        if(consentList == undefined || consentList == null) {
            console.log(`${new Date().toUTCString()} getSendgridContactList List not found!`);
            return null;
        }
    
        console.log(`${new Date().toUTCString()} getSendgridContactList finished`);
        return consentList;
    
    } catch(error) {
        console.log(`${new Date().toUTCString()} getSendgridContactList exception ${error}`);
        return {error};
    }
}

/*
checkIfContactExists = async(email, listId) => {

    try {
        console.log(`${new Date().toUTCString()} checkIfContactExists ${email} ${listId}`);

        const searchData = {
            query: `email LIKE '${email}' AND CONTAINS(list_ids, '${listId}')`
        }
    
        const searchRequest = {
            method: 'POST',
            url: '/v3/marketing/contacts/search',
            body: searchData,
            timeout: 10
        };
        let [searchResponse, searchBody] = await sgClient.request(searchRequest)
        if(searchResponse.statusCode != 200) {
            console.log(`${new Date().toUTCString()} checkIfContactExists Error searching for token!`);
            return {error: "Error searching for token!"};
        }
    
        var result = searchBody.contact_count == 0 ? null : searchBody.result[0];
        console.log(`${new Date().toUTCString()} checkIfContactExists finished ${result}`);
        return result;

    } catch(error) {
        console.log(`${new Date().toUTCString()} checkIfContactExists exception`);
        console.log(error);
        return {error};
    }
}*/

checkIfContactExists = async(email, sessionToken) => {

    try {
        console.log(`${new Date().toUTCString()} checkIfContactExists ${email}`);

        const options = {
            method: 'GET',
            headers: {
                "X-Parse-Application-Id": `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "X-Parse-Session-Token": sessionToken,
                "Content-Type": "application/json"
            },
        }

        const parameters = {
            "email": email
        }
        const encodedParams = encodeURIComponent(`${JSON.stringify(parameters)}`);
        const url = `${process.env.SERVER_URL}/classes/StudyInterest?where=${encodedParams}`;
        console.log(url)

        const response = await fetch(url, options);
        if(!response.ok) {
            console.log(`${new Date().toUTCString()} checkIfContactExist generateToken Error searching for email!`);
            return {error: "Error searching for email!"};
        }

        const body = await response.json();     
        var result = body.results.length == 0 ? null : body.results[0];
        console.log(`${new Date().toUTCString()} checkIfContactExists finished`);
        console.log(JSON.stringify(result));
        return result;

    } catch(error) {
        console.log(`${new Date().toUTCString()} checkIfContactExists exception`);
        console.log(error);
        return {error};
    }
}


getCustomFieldsIds = async() => {

    console.log(`${new Date().toUTCString()} getCustomFieldsIds`);

    const requestTemp = {
        method: 'GET',
        url: 'v3/marketing/field_definitions',
    };

    try {
        let [response, body] = await sgClient.request(requestTemp)
        if(response.statusCode != 200)
            return null;

        let customFieldMap = {}

        for(let customField of body.custom_fields) {
            customFieldMap[customField.name] = customField.id; 
        }

        console.log(`${new Date().toUTCString()} getCustomFieldsIds finished ${customFieldMap}`);

        return customFieldMap;
    } catch (error) {
        console.log(`${new Date().toUTCString()} getCustomFieldsIds exception ${error}`);
        return null;
    }
}


/*
sendNewContactToSendgrid = async(contact, activationToken, listId, email, formalTrial, smartphoneType, study) => {

    console.log(`${new Date().toUTCString()} sendNewContactToSendgrid ${contact}, ${activationToken}, ${listId}, ${email}, ${formalTrial}, ${smartphoneType}, ${study}`);

    let customFieldsIds = await getCustomFieldsIds();

    if(customFieldsIds == null) {
        return false;
    }
        
    const custom_fields = {}
    custom_fields[customFieldsIds['consent_get_involved_formal_trial']] = formalTrial;
    custom_fields[customFieldsIds['consent_get_involved_smartphone_type']] = smartphoneType;
    custom_fields[customFieldsIds['consent_get_involved_study']] = study;

    if(contact == null || 
        (contact != null && (contact.activated == 'false' || contact.activated == '' || contact.activated == null || contact.custom_fields.consent_get_involved_activated == undefined))) {
        custom_fields[customFieldsIds['consent_get_involved_activation_token']] = activationToken;
        custom_fields[customFieldsIds['consent_get_involved_activated']] = 'false';
    }

    //Send new contact to Sendgrid
    const data = {
        list_ids: [listId],
        contacts: [
            {
                email,
                custom_fields
            }
        ],
    }

    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: data,
    };

    try {
        let [responseContact, bodyContact] = await sgClient.request(request)
        if(responseContact.statusCode == 202 || responseContact.statusCode == 200) {
            console.log(`${new Date().toUTCString()} sendNewContactToSendgrid Saved contact`);
            return true;
        } else {
            console.log(`${new Date().toUTCString()} sendNewContactToSendgrid Error on contact saving`);
            return false;
        }
    } catch (error) {
        console.log(`${new Date().toUTCString()} sendNewContactToSendgrid Error on contact saving ${error}`);
        console.log(error.response.body.errors);
        return false;
    }
}

*/

sendNewContactToServer = async(contact, activationToken, email, formalTrial, smartphoneType, study, sessionToken) => {

    console.log(`${new Date().toUTCString()} sendNewContactToServer ${activationToken}, ${email}, ${formalTrial}, ${smartphoneType}, ${study}`);

    try {

        const options = {
            method: contact != null ? 'PUT' : 'POST',
            headers: {
                'X-Parse-Application-Id': `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "X-Parse-Session-Token": sessionToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                activationToken,
                formalTrial: formalTrial == "true",
                smartphoneType,
                study: study == "true",
                activated: false
            })
        }
    
        const url = `${process.env.SERVER_URL}/classes/StudyInterest${contact == null ? '' : `/${contact.objectId}`}`;
        console.log(url)
    
        const response = await fetch(url, options, {
            email,
            activationToken,
            formalTrial,
            smartphoneType,
            study
        });
        if(!response.ok) {
            console.log(`${new Date().toUTCString()} sendNewContactToServer Error on contact saving`);
            console.log(JSON.stringify(response));
            return false;
        }
    
        console.log(`${new Date().toUTCString()} sendNewContactToServer Saved contact`);
        return true;

    } catch (error) {
        console.log(`${new Date().toUTCString()} sendNewContactToServer Error on contact saving ${error}`);
        console.log(error.response.body.errors);
        return false;
    }
}

sendNewContactToSendgrid = async(email, listId) => {

    console.log(`${new Date().toUTCString()} sendNewContactToSendgrid ${email} ${listId}`);

    //Send new contact to Sendgrid
    const data = {
        list_ids: [listId],
        contacts: [
            {
                email,
            }
        ],
    }

    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: data,
    };

    try {
        let [responseContact, bodyContact] = await sgClient.request(request)
        if(responseContact.statusCode == 202 || responseContact.statusCode == 200) {
            console.log(`${new Date().toUTCString()} sendNewContactToSendgrid Saved contact`);
            return true;
        } else {
            console.log(`${new Date().toUTCString()} sendNewContactToSendgrid Error on contact saving`);
            return false;
        }
    } catch (error) {
        console.log(`${new Date().toUTCString()} sendNewContactToSendgrid Error on contact saving ${error}`);
        console.log(error.response.body.errors);
        return false;
    }
}

sendConfirmationEmail = async(email, activationToken) => {

    console.log(`${new Date().toUTCString()} sendConfirmationEmail ${email}, ${activationToken}`);

    const emailDelayMinutes = 3;
    const currentTime =  new Date();
    currentTime.setMinutes(currentTime.getMinutes() + emailDelayMinutes);
    const unixTimeInSeconds = Math.round(currentTime.getTime() / 1000);

    const confirmEmailEndpoint = '/confirm-email'; 

    const emailBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        templateId: process.env.CONFIRM_EMAIL_TEMPLATE_ID,
        dynamicTemplateData: {
            tokenLink: `${process.env.DOMAIN_URL}${confirmEmailEndpoint}?token=${activationToken}`,
            email,
        },
        //sendAt: unixTimeInSeconds
    }

    try {
        console.log(emailBody);
        const result = await sgMail.send(emailBody);
        console.log(result);
        console.log(`${new Date().toUTCString()} sendConfirmationEmail finished`);
        return true;
    } catch (error) {
        console.log(`${new Date().toUTCString()} sendConfirmationEmail exception ${error}`);
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
        }
        return false;
    }
}


searchToken = async(token, sessionToken) => {

    console.log(`${new Date().toUTCString()} searchToken ${token}`);
    try {

        const options = {
            method: 'GET',
            headers: {
                'X-Parse-Application-Id': `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "X-Parse-Session-Token": sessionToken,
                "Content-Type": "application/json"
            },
        }

        const parameters = {
            "activationToken": token
        }
        const encodedParams = encodeURIComponent(`${JSON.stringify(parameters)}`);
        const url = `${process.env.SERVER_URL}/classes/StudyInterest?where=${encodedParams}`;
        console.log(url)

        const response = await fetch(url, options);
        if(!response.ok) {
            console.log(`${new Date().toUTCString()} Error searching for token!`);
            return {error: "Error searching for token!"};
        }

        const body = await response.json();     
        var result = body.results.length == 0 ? null : body.results[0];
        console.log(`${new Date().toUTCString()} searchToken finished`);
        console.log(JSON.stringify(result));
        return result;

    } catch(error) {
        console.log(`${new Date().toUTCString()} searchToken exception ${error}`);
        return {error};
    }
}

/*
searchToken = async(token, listId) => {

    console.log(`${new Date().toUTCString()} searchToken ${token}, ${listId}`);

    const searchData = {
        query: `consent_get_involved_activation_token LIKE '${token}' AND CONTAINS(list_ids, '${listId}')`
    }

    const searchRequest = {
        method: 'POST',
        url: '/v3/marketing/contacts/search',
        body: searchData
    };

    try {
        let [searchResponse, searchBody] = await sgClient.request(searchRequest)
        if(searchResponse.statusCode != 200 || searchBody.contact_count == 0) {
            console.log(`${new Date().toUTCString()} Error searching for token!`);
            return {error: "Error searching for token!"};
        }
        console.log(`${new Date().toUTCString()} searchToken`);
        console.log(`${new Date().toUTCString()} searchToken ${searchBody.result[0]} finished`);
        return searchBody.result[0];
    } catch(error) {
        console.log(`${new Date().toUTCString()} searchToken exception ${error}`);
        return {error};
    }
}*/


/*
activateContact = async(contact, listId) => {

    console.log(`${new Date().toUTCString()} activateContact ${contact}, ${listId}`);

    try {
       
        let customFieldsIds = await getCustomFieldsIds();
    
        //Get a token from the parse server
        const options = {
            method: 'POST',
            headers: {
                'X-Parse-Application-Id': `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "Content-Type": "application/json"
            },            
        }
    
        const response = await fetch(`${process.env.SERVER_URL}/functions/generateToken`, options);
        if(!response.ok) {
            console.log(`${new Date().toUTCString()} activateContact generateToken error`);
            console.log(`${response.body}`);
            return false
        }
        const body = await response.json(); 
        const token = body.result;
       
       
        const custom_fields = {}
        custom_fields[customFieldsIds["consent_get_involved_activated"]] = "true";
        custom_fields[customFieldsIds["consent_get_involved_study_token"]] = token;
    
        const activateData = {
            list_ids: [listId],
            contacts: [
                {
                    email: contact.email,
                    custom_fields
                }
            ],
        }   
        const request = {
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body: activateData,
        };
        let [activateResponse, activateBody] = await sgClient.request(request)
    
        if(activateResponse.statusCode == 202 || activateResponse.statusCode == 200) {
            console.log(`${new Date().toUTCString()} activateContact Contact activated (${contact.email}).`);
            return true;
        } else {
            console.log(`${new Date().toUTCString()} activateContact exception Error on contact updating`);
            return false;
        }
    } catch(error) {
        console.log(`${new Date().toUTCString()} activateContact exception ${error}`);
        return false;
    }
}
*/

activateContact = async(contact, sessionToken) => {

    console.log(`${new Date().toUTCString()} activateContact ${JSON.stringify(contact)}`);

    try {

        if(contact == null || contact == undefined) {
            console.log(`${new Date().toUTCString()} activateContact not contact given error`);
            return false;
        }
       
        //Get a token from the parse server
        const optionsGenerateToken = {
            method: 'POST',
            headers: {
                'X-Parse-Application-Id': `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "X-Parse-Session-Token": sessionToken,
                "Content-Type": "application/json"
            },            
        }
    
        const responseGenerateToken = await fetch(`${process.env.SERVER_URL}/functions/generateToken`, optionsGenerateToken);
        if(!responseGenerateToken.ok) {
            console.log(`${new Date().toUTCString()} activateContact generateToken error`);
            console.log(`${responseGenerateToken.body}`);
            return false
        }
        const body = await responseGenerateToken.json(); 
        const token = body.result;
       
        //Save updated contact
        const optionsUpdateContact = {
            method: 'PUT',
            headers: {
                'X-Parse-Application-Id': `${process.env.APP_ID}`,
                "X-Parse-REST-API-Key": `${process.env.REST_API_KEY}`,
                "X-Parse-Session-Token": sessionToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                studyToken: token,
                activated: true
            })
        }

        const urlUpdateContact = `${process.env.SERVER_URL}/classes/StudyInterest/${contact.objectId}`;
        console.log(urlUpdateContact)
    
        const responseUpdateContact = await fetch(urlUpdateContact, optionsUpdateContact);
        if(!responseUpdateContact.ok) {
            console.log(`${new Date().toUTCString()} activateContact exception Error on contact updating`);
            console.log(JSON.stringify(responseUpdateContact));
            return false;
        }
    
        console.log(`${new Date().toUTCString()} activateContact Contact activated (${contact.email}).`);
        return true;
       
    } catch(error) {
        console.log(`${new Date().toUTCString()} activateContact exception ${error}`);
        return false;
    }
}

exports.postSignUp = async (req, res, next) => {

    console.log(`${new Date().toUTCString()} postSignUp ${req.body["email"]}`);

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        var sessionToken = await loginAdmin();
        if(sessionToken == null || sessionToken == undefined) {
            return res.status(500).send('Error Signing Up');
        }
    
        //Check if contact already exists and it's activated.
        var contact = null;
        var gotCheckIfContactExists = false;
        var checkIfContactExistsAttempts = 0;
        while(!gotCheckIfContactExists && checkIfContactExistsAttempts  < 4) {
            contact = await checkIfContactExists(req.body["email"], sessionToken);
            if(contact != null && contact.error != null) {
                console.log(`${new Date().toUTCString()} postSignUp Check If Contact Exists failed ${req.body["email"]} ${checkIfContactExistsAttempts}`);
                checkIfContactExistsAttempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                gotCheckIfContactExists = true;
            }
        }
        if(!gotCheckIfContactExists) {
            return res.status(500).send('Error Signing Up');
        }

        console.log(JSON.stringify(contact));

        if(contact == null) {
            //Get Sendgrid Contact Lists
            var consentList = null;
            var gotConsentList = false; 
            var consentListAttempts = 0;
            while(!gotConsentList && consentListAttempts < 4) {
                consentList = await getSendgridContactList();
                if(consentList != null && consentList.error != null) {
                    console.log(`${new Date().toUTCString()} postSignUp Error getting contact list ${consentListAttempts}`);
                    consentListAttempts++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    gotConsentList = true;
                }
            }
            if(!gotConsentList) {
                return res.status(500).send('Error Signing Up');
            }

            //Send new contact to Sendgrid
            var sendSuccessful = false;
            var sendNewContactToSendgridAttemps = 0;
            while(!sendSuccessful && sendNewContactToSendgridAttemps  < 4) {
                sendSuccessful = await sendNewContactToSendgrid(req.body["email"], consentList.id);
                if(!sendSuccessful) {
                    console.log(`${new Date().toUTCString()} postSignUp Save contact failed ${req.body["email"]}`);
                    sendNewContactToSendgridAttemps++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } 
            }
            if(!sendSuccessful) {
                return res.status(500).send('Error Signing Up');
            }
        }
        
        //Generate activation token
        const activationToken = crypto.randomBytes(64).toString('hex');

        //Send new contact to server
        var sendServerSuccessful = await sendNewContactToServer(contact, activationToken, req.body["email"], req.body["formal_trial"].toString(), req.body["smartphone_type"].toString(), req.body["study"].toString(), sessionToken);
        if(!sendServerSuccessful) {
            console.log(`${new Date().toUTCString()} postSignUp Save contact to server failed ${req.body["email"]}`);
            return res.status(500).send('Error Signing Up');
        } 
    
        //if already activated, no need to send email
        if(contact != null && contact.activated == 'true') {
            console.log(`${new Date().toUTCString()} postSignUp Contact already exists, dont send email`, req.body["email"], contact, contact.custom_fields.consent_get_involved_activated);
            return res.status(200).send('Saved contact');
        }

        //Send Confirmation email
        console.log(`${new Date().toUTCString()} postSignUp Sending email ${req.body["email"]}`);
        const sendEmailSuccessful = await sendConfirmationEmail(req.body["email"], activationToken);
        if(sendEmailSuccessful) {
            console.log(`${new Date().toUTCString()} postSignUp finished Saved contact ${req.body["email"]}`);
            return res.status(200).send('Saved contact');
        } else {
            console.log(`${new Date().toUTCString()} postSignUp finished Error Signing Up ${req.body["email"]}`);
            return res.status(500).send('Error Signing Up');
        }
    } catch(e) {
        console.error(e);
        return res.status(500).send('Error Signing Up');
    }
}

exports.getConfirmEmail = async (req, res, next) => {
 
    console.log(`${new Date().toUTCString()} getConfirmEmail`);

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        //Get Sendgrid Contact Lists
        /*
        var consentList = null;
        var gotConsentList = false; 
        var consentListAttempts = 0;
        while(!gotConsentList && consentListAttempts < 4) {
            consentList = await getSendgridContactList();
            if(consentList != null && consentList.error != null) {
                console.log(`${new Date().toUTCString()} getConfirmEmail Error getting contact list ${consentListAttempts}`);
                consentListAttempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                gotConsentList = true;
            }
        }
        if(!gotConsentList) {
            console.log(`${new Date().toUTCString()} getConfirmEmail Error getting lists!`);
            return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
        }*/

        var sessionToken = await loginAdmin();
        if(sessionToken == null || sessionToken == undefined) {
            return res.status(500).send('Error Signing Up');
        }

        //Search for token
        var contact = null;
        var gotContact = false;
        var contactAttempts = 0;
        while(!gotContact && contactAttempts < 4) {
            contact = await searchToken(req.query.token, sessionToken);
            if(contact != null && contact.error != null) {
                console.log(`${new Date().toUTCString()} getConfirmEmail Error search token ${contactAttempts}`);
                contactAttempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                gotContact = true;
            }
        }
        if(!gotContact) {
            console.log(`${new Date().toUTCString()} getConfirmEmail Error search token! finished`);
            return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
        }

        //Update contact to activated
        var activated = false;
        var activatedAttempts = 0;
        while(!activated && activatedAttempts < 4) {
            activated = await activateContact(contact, sessionToken);
            if(!activated) {
                console.log(`${new Date().toUTCString()} getConfirmEmail Error activating contact ${activatedAttempts}`);
                activatedAttempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } 
        }
        if(!activated) {
            console.log(`${new Date().toUTCString()} getConfirmEmail Error getting lists! finished`);
            return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
        }

        console.log(`${new Date().toUTCString()} getConfirmEmail finish`);
        return res.redirect(process.env.TOKEN_ACTIVATED_REDIRECT_URL);
    } catch(e) {
        console.error(e);
        return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
    }

}