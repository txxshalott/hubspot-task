/** Create, get, associate contacts and companies on hubspot | March 2023 */

const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));

/* middleware: functions/operations called b/w processing Request and sending Response
 * used to send data in the form of an object */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

require('dotenv').config();
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS

const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
}

//check if company exists
async function findCompany(target){
    const companyList = `https://api.hubspot.com/crm/v3/objects/companies`;
    
    try{
        const companies = await axios.get(companyList, { headers }); //object array
        
        const data = companies.data.results;
        
        //object array: data[ {one}, {two}, {three} ]
        for (let i = 0; i < data.length; i++) {
            if (data[i].properties.name === target) {

                console.log("worked " + data[i].properties.hs_object_id); //this works

                return data[i].properties.hs_object_id; //but this doesnt seem to?
            } 
        }
        return -20;

        //let found = data.properties.find(data => data.properties.name === target); 
    } catch (err) { console.error(err)} ;
}
findCompany("carrd.co")

//ASSOCIATION - make
app.get('/makeassociation', async (req, res) => { 
    //crm/v3/objects/contacts/{contactId}/associations/{toObjectType}/{toObjectId}/{associationTypeId}
    
    var target = "onion gone";
    const toObjectId = await findCompany(target);
    console.log("object id: " + toObjectId);

    if (toObjectId === -20) {
        res.send("hahaha L");
        makecompany("company not found");
        
    } else {
        const contactId = "101";
        const associationTypeId = "1";

        const association = { 
            properties: {
                contactId: contactId,
                toObjectId: toObjectId, //"15266530698"
                associationTypeId: associationTypeId //https://legacydocs.hubspot.com/docs/methods/crm-associations/crm-associations-overview
            }
        }
        const endpoint = `https://api.hubspot.com/crm/v3/objects/contacts/${contactId}/associations/companies/${toObjectId}/${associationTypeId}`;

        try{
            await axios.put(endpoint, association, {headers});
            res.send("created association to " + target);
            console.log("created association to" + target);

        } catch (err) { console.error(err) } ;
    }
});

//PERSON - make
app.get('/makecontact', async (req, res) => {
    const person = { 
        properties: {
            "email": "example@hubspot.com",
            "firstname": "Jane",
            "lastname": "Doe",
            "phone": "(555) 555-5555",
            "company": "HubSpot",
            "website": "hubspot.com",
            "lifecyclestage": "marketingqualifiedlead"
        }
    }

    const endpoint = 'https://api.hubspot.com/crm/v3/objects/contacts';

    try{
        await axios.post(endpoint, person, {headers});
        console.log("created contact")

    } catch (err) {
        console.error(err);
    }
});
//createContact(email, phone, lifecycleStage)

//COMPANY
app.get('/createcomp', async(req, res) => { makecompany("unreal") });

async function makecompany(name) {
    const company = {
        properties: {
            name: name,
            "domain": "carrd.co",
            "city": "Toronto",
            "industry": "Chemicals",
            "phone": "555-555-555",
            "state": "Ohio",
        }
    }

    const endpoint = 'https://api.hubspot.com/crm/v3/objects/companies';

    try{
        await axios.post(endpoint, company, {headers});
        console.log("created company or did i")

    } catch (err) {
        console.error(err);
    }
};

//GET CONTACTS
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';

    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

//FAV BOOK
app.get('/update', async (req, res) => {
    const email = req.query.email;
    console.log(email);

    const getInfo = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email&properties=email,favourite_book`;

    try {
        const response = await axios.get(getInfo, { headers });
        const data = response.data;
        console.log(data);
        res.render('update', {userEmail: data.properties.email, favouriteBook: data.properties.favourite_book});
        
    } catch(err) {
        console.error(err);
        console.log(":(");
    }
});

app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favourite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateHere = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;

    try {     
        await axios.patch(updateHere, update, { headers } ); //tutorial says patch
        res.redirect('back');
    } catch(err) {
        console.error(err);
        if (err.response) {
            console.log("response error")
        } else if (err.request) {
            console.log("request error")
        } else if (err.message) {
            console.log("message error")
        }
    }
});
app.listen(3000, () => console.log('Listening on http://localhost:3000'));