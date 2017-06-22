console.log('sparcs.js loaded')

//
sparcs = function(){
    console.log('sparcs.js ini')
    // --- if being called from MATHBIOL --- //
    if(window['mathbiol']&&cmdSide){
        let h = '<p><b style="color:maroon;font-size:large">SPARCS</b>: New York Statewide Planning and Research Cooperative System (SPARCS) Inpatient De-Identified dataset </p>'
        //cmdSide.innerHTML +='<h4 id="sparcsCountyHead"><span id="sparcsCounty">Suffolk</span></h4>'
        h+= '<ol id="sparcsYearsInfo"></ol>'
        cmdSide.innerHTML=h
        sparcs.countCounty()
        //cmdSide.innerHTML +='<p>Checking data for years '+sparcs.years.join(', ')+' ...</p>'
    }
}


sparcs.urls={
    "2009":{url:"https://health.data.ny.gov/resource/s8d9-z734.json"},
    "2010":{url:"https://health.data.ny.gov/resource/dpew-wqcg.json"},
    "2011":{url:"https://health.data.ny.gov/resource/n5y9-zanf.json"},
    "2012":{url:"https://health.data.ny.gov/resource/rv8x-4fm3.json"},
    "2013":{url:"https://health.data.ny.gov/resource/tdf6-7fpk.json"},
    "2014":{url:"https://health.data.ny.gov/resource/pzzw-8zdv.json"}
}
sparcs.years=Object.getOwnPropertyNames(sparcs.urls)

sparcs.countCounty=function(){
    sparcs.years.forEach(function(yr){
        sparcs.urls[yr].county={}
        var li = document.createElement('li')
        sparcsYearsInfo.appendChild(li)
        li.innerHTML='<b>'+yr+'</b>: <span style="color:orange">counting ...</span>'
        li.id="liYear_"+yr
        var url = sparcs.urls[yr].url
        // https://dev.socrata.com/docs/queries/
        // https://dev.socrata.com/docs/functions
        mathbiol.sys.getJSON(url+'?$select=hospital_county,%20count(*)&$group=hospital_county',function(x){
            sparcs.urls[yr].count=0
            x.forEach(function(xi){
                xi.hospital_county=xi.hospital_county||'NA'
                sparcs.urls[yr].county[xi.hospital_county]={count:parseInt(xi.count)}
                sparcs.urls[yr].count+=sparcs.urls[yr].county[xi.hospital_county].count
                4

            })
            li.innerHTML='<b style="color:blue">'+yr+'</b>: found <b style="color:blue">'+sparcs.urls[yr].count.toLocaleString()+'</b> patient records in <b style="color:blue">'+Object.entries(sparcs.urls[yr].county).length+'</b> counties</span>'
        })

        4
    })
    4
}







sparcs()

