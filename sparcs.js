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
    tdYear.innerHTML = '<select multiple id="yearSelect"></select>'
    // show years
    sparcs.county={} // take the opportunity to list counties
    sparcs.years.forEach(function(y){
        var op = document.createElement('option')
        yearSelect.appendChild(op)
        op.value=op.textContent=y
        Object.getOwnPropertyNames(sparcs.urls[y].county).forEach(function(c){
            if(!sparcs.county[c]){sparcs.county[c]={}}
            if(!sparcs.county[c][y]){sparcs.county[c][y]={}}
            sparcs.county[c][y]=sparcs.urls[y].county[c].count
        })
    })
    yearSelect.size=sparcs.years.length // to match number of years
    // Counties
    var tdCounty = document.createElement('td')
    rangeTR.appendChild(tdCounty)
    tdCounty.id='tdCounty' // globalized via DOM, not JS (it will go away with the element's dismissal)
    tdCounty.style.verticalAlign="top"
    tdCounty.innerHTML = '<select id="countySelect"></select>'
    Object.getOwnPropertyNames(sparcs.county).forEach(function(c){
        var op = document.createElement('option')
        countySelect.appendChild(op)
        op.value=op.textContent=c
    })
    countySelect.size=20
    // selectVars
    sparcs.vars.forEach(function(vr){
        var op1 = document.createElement('option')
        var op2 = document.createElement('option')
        op1.textContent=op2.textContent=vr
        selectVar1.appendChild(op1)
        selectVar2.appendChild(op2)

    })
    var tdVars = document.createElement('td')
    tdVars.id="tdVars"
    rangeTR.appendChild(tdVars)
    //var tblVars = document.createElement('table') // tabulation of var1 with var2
    //tblVars.id="tblVars" // we'll tabulate here
    //tdVars.appendChild(tblVars)
    // metadata
    sparcs.varInfo={}
    sparcs.vars.forEach(function(v){
        sparcs.varInfo[v]={'type':'str'}
        var numTypes=["total_charges", "total_costs"]
        if(numTypes.indexOf(v)>=0){
            sparcs.varInfo[v].type='num'
        }
    })
    // default selections
    countySelect.selectedIndex=Object.getOwnPropertyNames(sparcs.county).indexOf("Suffolk")
    yearSelect.selectedIndex=yearSelect.options.length-1 // last year available
    selectVar1.selectedIndex=sparcs.vars.indexOf('ccs_diagnosis_description')
    selectVar2.selectedIndex=sparcs.vars.indexOf('facility_name')

    sparcs.tabulate()
}

sparcs.tabulate=function(){ // tabulate variable selections
    var url = sparcs.urls[yearSelect.value].url
    //var q = '?$where=hospital_county='+countySelect.value+'&$SELECT= '+selectVar1.value+', '+selectVar2.value+', COUNT(*) as count GROUP BY '+selectVar1.value+', '+selectVar2.value
    //var q = '?$query = SELECT '+selectVar1.value+', '+selectVar2.value+', COUNT(*) as count GROUP BY '+selectVar1.value+', '+selectVar2.value+' WHERE +hospital_county='+countySelect.value
    var q = '?$SELECT='+selectVar1.value+', '+selectVar2.value+', COUNT(*) as count&$group='+selectVar1.value+', '+selectVar2.value+'&$where=hospital_county="'+countySelect.value+'"'
    //var q = '?$SELECT= '+selectVar1.value+', '+selectVar2.value+', COUNT(*) as count GROUP BY '+selectVar1.value+', '+selectVar2.value
    $.getJSON(url+q,function(x){
        tdVars.innerHTML.innerHTML='' //reset
        tdVars.appendChild(sparcs.tabCount(x))
    })
    //debugger
}

sparcs.tabCount=function(x){
    var tb = document.createElement('table')
    return tb
    //debugger
}






sparcs()

mathbiol.andrej=function(x){alert('Andrej says "'+x+'"')}

