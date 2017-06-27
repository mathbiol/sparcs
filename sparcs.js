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
         .then(_=>sparcs.rangeUI())
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
    var pp =[] // promises
    // get variables
    pp.push($.getJSON('https://health.data.ny.gov/resource/pzzw-8zdv.json?$limit=1',function(x){ // sampling one reccord from 2014
        sparcs.vars=Object.getOwnPropertyNames(x[0])
    }))
    sparcs.years.forEach(function(yr){
        sparcs.urls[yr].county={}
        var li = document.createElement('li')
        sparcsYearsInfo.appendChild(li)
        li.innerHTML='<b>'+yr+'</b>: <span style="color:orange">counting ...</span>'
        li.id="liYear_"+yr
        var url = sparcs.urls[yr].url
        // https://dev.socrata.com/docs/queries/
        // https://dev.socrata.com/docs/functions
        pp.push($.getJSON(url+'?$select=hospital_county,%20count(*)&$group=hospital_county',function(x){
            sparcs.urls[yr].count=0
            x.forEach(function(xi){
                xi.hospital_county=xi.hospital_county||'NA'
                sparcs.urls[yr].county[xi.hospital_county]={count:parseInt(xi.count)}
                sparcs.urls[yr].count+=sparcs.urls[yr].county[xi.hospital_county].count
                4

            })
            li.innerHTML='<b style="color:blue">'+yr+'</b>: found <b style="color:blue">'+sparcs.urls[yr].count.toLocaleString()+'</b> patient records in <b style="color:blue">'+Object.entries(sparcs.urls[yr].county).length+'</b> counties</span>'
        }))
    })
    //console.log(pp)
    return Promise.all(pp)
}

sparcs.rangeUI=function(div){ // assemple UI with ranges
    div=div||cmdResults // default div with id cmdResults
    div.innerHTML='' // reset div
    var h = '<table id="sparcsTable" style="margin:20px">'
    h += '<thead><tr>'
        h += '<th>Year</th>'
        h += '<th>County</th>'
        h += '<th id="thVar">Var1:<select id="selectVar1"></select>, Var2:<select id="selectVar2"></select></th>'
        h += '<th id="thPlot"><div id="divPlot"></div></th>'
    h += '</tr></thead>'
    h += '<tbody>'
        h += '<tr id="rangeTR"><tr>'
    h += '<tbody>'
    h += '</table>'
    div.innerHTML=h
    // years

    var tdYear = document.createElement('td')
    rangeTR.appendChild(tdYear)
    tdYear.id='tdYear' // globalized via DOM, not JS (it will go away with the element's dismissal)
    tdYear.style.verticalAlign="top"
    tdYear.innerHTML = '<select multiple id="tdYearSelect"></select>'
    // show years
    sparcs.county={} // take the opportunity to list counties
    sparcs.years.forEach(function(y){
        var op = document.createElement('option')
        tdYearSelect.appendChild(op)
        op.value=op.textContent=y
        Object.getOwnPropertyNames(sparcs.urls[y].county).forEach(function(c){
            if(!sparcs.county[c]){sparcs.county[c]={}}
            if(!sparcs.county[c][y]){sparcs.county[c][y]={}}
            sparcs.county[c][y]=sparcs.urls[y].county[c].count
        })
    })
    tdYearSelect.size=sparcs.years.length // to match number of years
    // Counties
    var tdCounty = document.createElement('td')
    rangeTR.appendChild(tdCounty)
    tdCounty.id='tdCounty' // globalized via DOM, not JS (it will go away with the element's dismissal)
    tdCounty.style.verticalAlign="top"
    tdCounty.innerHTML = '<select id="tdCountySelect"></select>'
    Object.getOwnPropertyNames(sparcs.county).forEach(function(c){
        var op = document.createElement('option')
        tdCountySelect.appendChild(op)
        op.value=op.textContent=c
    })
    //tdCountySelect.size=Object.getOwnPropertyNames(sparcs.county).length
    tdCountySelect.size=20

    4
    

}






sparcs()

