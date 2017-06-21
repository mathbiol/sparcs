var client = new stitch.StitchClient('helloworld-rtkjz');
var db = client.service('mongodb', 'mongodb-atlas').db('sparcs');
client.login().then(() =>
    db.collection('suffolk').updateOne({owner_id: client.authedId()}, {$set:{number:42}}, {upsert:true})
  ).then(()=>
    db.collection('suffolk').find({owner_id: client.authedId()})
  ).then(docs => {
    console.log("Found docs", docs)
    console.log("[MongoDB Stitch] Connected to Stitch")
  }).catch(err => {
    console.error(err)
  });
