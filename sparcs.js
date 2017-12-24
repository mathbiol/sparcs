console.log('sparcs.js loaded')

//
sparcs = function(){
    console.log('sparcs.js ini')
    // --- if being called from MATHBIOL --- //
    if(window['mathbiol']&&cmdSide){
        let h = '<p><b style="color:maroon;font-size:large">SPARCS</b>: New York Statewide Planning and Research Cooperative System (<a href="https://www.health.ny.gov/statistics/sparcs/" target="_blank">SPARCS</a>) Inpatient De-Identified dataset </p>'
        //cmdSide.innerHTML +='<h4 id="sparcsCountyHead"><span id="sparcsCounty">Suffolk</span></h4>'
        h+= '<ol id="sparcsYearsInfo"></ol>'
        h+= '<p>For more information type <span id="typeHelpSparcs" style="background-color:black;color:yellowgreen;cursor:pointer">&nbsp;help sparcs&nbsp;</span> (or click on me).<br> For a 10 min demo have a look at this <a href="https://www.youtube.com/watch?v=NZkJeT6R_H4" target="_blank" style="background-color:red;color:white">&nbsp;YouTube video </a>.</p>'
        cmdSide.innerHTML=h
        sparcs.countCounty().then(_=>sparcs.rangeUI())
        typeHelpSparcs.onclick=function(){
            mathbiol.sys.cmdSlow('help sparcs')
        }
        sparcs.zip3() // load zip shapes
    }
}


sparcs.urls={
    "2009":{url:"https://health.data.ny.gov/resource/s8d9-z734"},
    "2010":{url:"https://health.data.ny.gov/resource/dpew-wqcg"},
    "2011":{url:"https://health.data.ny.gov/resource/n5y9-zanf"},
    "2012":{url:"https://health.data.ny.gov/resource/rv8x-4fm3"},
    "2013":{url:"https://health.data.ny.gov/resource/tdf6-7fpk"},
    "2014":{url:"https://health.data.ny.gov/resource/pzzw-8zdv"},
    "2015":{url:"https://health.data.ny.gov/resource/82xm-y6g8"}
}
sparcs.years=Object.getOwnPropertyNames(sparcs.urls)

sparcs.getJSON=function(url){
    if(url.match('n5y9-zanf')){ // fixing 2011 data structure
        url = url.replace(/age_group/g,'age')
    }
    function fix2011(x){
        if(url.match('n5y9-zanf')){ // fix misslabeling of .age_group and .age
            x=x.map(function(xi){
                xi.age_group=xi.age
                return xi
            })
        }
        return x
    }
    return new Promise(function(resolve, reject) {
      // do a thing, possibly async, then…
      localforage.getItem(url)
        .then(function(x){
            if(x){
                resolve(fix2011(x))
            }else{
                $.getJSON(url)
                 .then(function(x){
                  localforage.setItem(url,x)
                  resolve(fix2011(x))
                })
                 .fail(function(err){reject(err)})
            }})
    })
}


/*
sparcs.getJSON=function(url,fun,err){
    localforage.getItem(url)
     .then(function(x){fun(x)})
     .catch(function(){
         $.getJSON(url)
          .then(function(x){
              localforage.setItem(url,x)
              fun(x)
          })
          .fail(function(x){err(x)})
     })
}
*/

sparcs.countCounty=function(){
    var pp =[] // promises
    // get variables
    pp.push(
        sparcs.getJSON('https://health.data.ny.gov/resource/pzzw-8zdv.json?$limit=1')
         .then(function(x){ // sampling one reccord from 2014
            sparcs.vars=Object.getOwnPropertyNames(x[0])
          })
    )
    sparcs.years.forEach(function(yr){
        sparcs.urls[yr].county={}
        var li = document.createElement('li')
        sparcsYearsInfo.appendChild(li)
        li.innerHTML='<b>'+yr+'</b>: <span style="color:orange">counting ...</span>'
        li.id="liYear_"+yr
        var url = sparcs.urls[yr].url
        // https://dev.socrata.com/docs/queries/
        // https://dev.socrata.com/docs/functions
        pp.push(sparcs.getJSON(url+'?$select=hospital_county,%20count(*)&$group=hospital_county&$limit=10000')
         .then(function(x){
            sparcs.urls[yr].count=0
            x.forEach(function(xi){
                xi.hospital_county=xi.hospital_county||'NA'
                sparcs.urls[yr].county[xi.hospital_county]={count:parseInt(xi.count)}
                sparcs.urls[yr].count+=sparcs.urls[yr].county[xi.hospital_county].count
                4

            })
            li.innerHTML='For <b style="color:blue">'+yr+'</b> found <b style="color:blue">'+sparcs.urls[yr].count.toLocaleString()+'</b> patient records in <b style="color:blue">'+Object.entries(sparcs.urls[yr].county).length+'</b> counties</span>'
        }))
    })
    //console.log(pp)
    return Promise.all(pp)
}
sparcs.match=function(patt,q){
    q='('+q.replace(/\s*\,\s*/g,')|(')+')'
    q=q.replace('|()','')
    //console.log(patt,q)
    return patt.match(new RegExp(q,'i'))    
}

sparcs.rangeUI=function(div){ // assemple UI with ranges
    div=div||cmdResults // default div with id cmdResults
    div.innerHTML='' // reset div
    var h = '<table id="sparcsTable" style="margin:20px">'
    h += '<thead><tr>'
        h += '<th>Year</th>'
        h += '<th>County</th>'
        h += '<th id="thVar">'
        h += '<i class="fa fa-clone" aria-hidden="true" style="color:orange;cursor:pointer" id="copyTableToClipboard"></i> <input id="constrainRows" style="color:silver" value=" query rows, i.e. cancer"> Var1:<select id="selectVar1" style="color:green"></select> <i class="fa fa-arrows-h" aria-hidden="true" style="color:orange;cursor:pointer" id="reverseVarSelection"></i> Var2:<select id="selectVar2" style="color:navy"></select><input id="constrainCols" style="color:silver" value=" query cols, i.e. south"> <span id="filterMore" style="color:blue;cursor:pointer"><i class="fa fa-plus-circle" aria-hidden="true"></i> filter</span>'
        h += '<div id="filterMoreDiv" hidden=true>Additional filter: <input id="filterInput" size=80 style="color:silver"></div>'
        h += '</th>'
        //h += '<th id="thVar"><i class="fa fa-clone" aria-hidden="true" style="color:orange;cursor:pointer" id="copyTableToClipboard"></i> <input id="constrainRows" style="color:silver" value=" query rows, i.e. cancer"> Var1:<select id="selectVar1" style="color:green"></select> <i class="fa fa-arrows-h" aria-hidden="true" style="color:orange;cursor:pointer" id="reverseVarSelection"></i> Var2:<select id="selectVar2" style="color:navy"></select></th>'
        h += '<th id="thPlot"><div id="divPlot"></div></th>'
    h += '</tr></thead>'
    h += '<tbody>'
        h += '<tr id="rangeTR"><tr>'
    h += '<tbody>'
    h += '</table>'
    div.innerHTML=h
    filterInput.value='zip_code_3_digits="117" OR zip_code_3_digits="119"'
    // years

    reverseVarSelection.onclick=function(){
        if(constrainCols.style.color=="silver"){
            constrainCols.value=''
            constrainCols.style.color='navy'
        }
        if(constrainRows.style.color=="silver"){
            constrainRows.value=''
            constrainRows.style.color='green'
        }
        var s1 = selectVar1.selectedIndex
        var s2 = selectVar2.selectedIndex
        selectVar1.selectedIndex=s2
        selectVar2.selectedIndex=s1
        if(constrainRows.style.color=="silver"){
            constrainCols.value=''
            constrainRows.style.color='green'
        }
        if(constrainCols.style.color=="silver"){
            constrainRows.value=''
            constrainCols.style.color='navy'
        }
        var vr = constrainRows.value
        var vc = constrainCols.value
        constrainRows.value=vc
        constrainCols.value=vr
        selectVar2.onchange()
        constrainRows.onkeyup()
        constrainRows.onkeyup()
    }

    constrainRows.onkeyup=function(evt){
        var q = this.value//.toLowerCase()
        sparcs.table.trs.forEach(function(tr){
            //if($('th',tr)[0].textContent.match((new RegExp(q,'i')))){
            if(sparcs.match($('th',tr)[0].textContent,q)){
                tr.hidden=false
            }else{
                tr.hidden=true
            }
        })
        //sparcs.clickAgain()
    }
    constrainRows.onclick=function(){
        if(this.style.color=="silver"){
            this.style.color="green"
            if(this.value==" query rows, i.e. cancer"){
                this.value=""
            }else{
                constrainRows.onkeyup()
            }
        }
        //debugger
    }

    
    constrainCols.onkeyup=function(evt){
        var q = this.value
        var ii = [] 
        sparcs.table.colVals.forEach(function(v,i){
            if(sparcs.match(v,q)){
            //if(v.toLowerCase().match(new RegExp(q))){
                ii.push(i)
            }
        })
        // hide ii columns
        sparcs.table.tds.forEach(function(tds){
            tds.forEach(function(td,i){
                if(ii.indexOf(i)>=0){
                    td.hidden=false
                }else{
                    td.hidden=true
                }
            })
        })
        for(var i=0;i<sparcs.table.tds[0].length;i++){
            if(ii.indexOf(i)>=0){
                sparcs.table.tbl.tHead.children[i+1].hidden=false
            }else{
                sparcs.table.tbl.tHead.children[i+1].hidden=true
            }
        }
        sparcs.table.hideOtherCols=ii
        //sparcs.clickAgain()
    }
    constrainCols.onclick=function(){
        if(this.style.color=="silver"){
            this.style.color="navy"
            if(this.value==" query cols, i.e. south"){
                this.value=""
            }else{
                constrainCols.onkeyup()
            }
        }
        //debugger
    }
    
    copyTableToClipboard.onclick=function(){  // using rangeTR
        var sel = window.getSelection()
        var ra = document.createRange()
        ra.selectNodeContents(sparcs.table.tbl)
        sel.removeAllRanges()
        sel.addRange(ra)
        document.execCommand('copy')
        mathbiol.msg('table copied to clipboard','orange')
    }

    filterMore.onclick=function(){
        if(filterMoreDiv.hidden){
            filterMoreDiv.hidden=false
            filterMore.innerHTML='<i class="fa fa-minus-circle" aria-hidden="true"></i> remove filter'
            filterMore.style.color='maroon'
            if(filterInput.style.color!=='silver'){
                sparcs.tabulate()
            }
        }else{
            filterMoreDiv.hidden=true
            filterMore.innerHTML='<i class="fa fa-plus-circle" aria-hidden="true"></i> filter'
            filterMore.style.color='blue'
            sparcs.tabulate()

        }
            
        //debugger
    }

    filterInput.onclick=function(){
        this.style.fontSize="13px"
        this.style.color="blue"
    }
    filterInput.onkeyup=function(ev){
        if(ev.keyCode==13){
            sparcs.tabulate()
        }
    }

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
    var vars = JSON.parse(JSON.stringify(sparcs.vars)) // clone array
    //vars.splice(sparcs.vars.indexOf("hospital_county"),1)
    vars.forEach(function(vr){
        var op1 = document.createElement('option')
        var op2 = document.createElement('option')
        op1.textContent=op2.textContent=vr
        selectVar1.appendChild(op1)
        selectVar2.appendChild(op2)
        //selectVar2.onchange()
        //sparcs.tabulate()
    })
    var tdVars = document.createElement('td')
    tdVars.style.verticalAlign="top"
    tdVars.id="tdVars"
    rangeTR.appendChild(tdVars)
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
    selectVar1.onchange=selectVar2.onchange=yearSelect.onchange=countySelect.onchange=function(){
        mathbiol.msg('loading count table ...','red')
        sparcs.tabulate()
    }

    // filter more
    /*
    sparcs.vars.forEach(function(v){
        var op=document.createElement('option')
        op.value=op.textContent=v
        filterParm.appendChild(op)
    })
    filterMoreDiv.appendChild(filterParm)
    */


    // reactive adjustments
    cmd.onmouseup=cmd.onmouseleave=function(){cmdMsgPre.style.width=cmd.style.width}
}

sparcs.tabulate=function(){ // tabulate variable selections
    var url = sparcs.urls[yearSelect.value].url+'.json'
    var q = '?$SELECT='+selectVar1.value+', '+selectVar2.value+', COUNT(*) as count&$group='+selectVar1.value+', '+selectVar2.value+'&$where=hospital_county="'+countySelect.value+'"&$limit=10000'
    if((!filterMoreDiv.hidden)&&(filterInput.style.color!=='silver')&&(filterInput.value.length>5)){
        q = '?$SELECT='+selectVar1.value+', '+selectVar2.value+', COUNT(*) as count&$group='+selectVar1.value+', '+selectVar2.value+'&$where=hospital_county="'+countySelect.value+'" AND ('+filterInput.value+')&$limit=10000'
        console.log('filtered query:',url+q)
    }
    sparcs.getJSON(url+q)
     .then(function(x){
        //debugger
        tdVars.innerHTML=''//'<div id="plotlyBarChartDiv"></div>' //reset
        tdVars.appendChild(sparcs.tabCount(x))
        mathbiol.msg('loading count table ... done')
        sparcs.clickAgain()
    }).catch(function(err){
        mathbiol.msg(err.statusText,'red')
        tdVars.innerHTML='<p style="color:red" align="center">Bad Request</p>'
    })
    
    /*
    sparcs.getJSON(url+q,function(x){
        tdVars.innerHTML='' //reset
        tdVars.appendChild(sparcs.tabCount(x))
        mathbiol.msg('loading count table ... done')
    },function(err){
        mathbiol.msg(err.statusText,'red')
        tdVars.innerHTML='<p style="color:red" align="center">Bad Request</p>'
    })
    */
}

sparcs.toArray=function(obj){
    var y = []
    obj.forEach(function(xi){y.push(xi)})
    return y
}

sparcs.hideOtherCols=function(x){
    //debugger
    if(sparcs.table.hideOtherCols){
        x=x.filter(function(xi,i){
            if(sparcs.table.hideOtherCols.indexOf(i)>=0){
                return true
            }else{
                return false
            }
        })
    }
    return x
}

sparcs.tabCount=function(x){
    var tb = document.createElement('table')
    tb.border=true
    tb.style.borderColor='silver'
    // assemble table
    var colName = selectVar2.value, rowName = selectVar1.value
    var colVals = {}, rowVals = {}
    x.forEach(function(v){
        colVals[v[colName]]=true
        rowVals[v[rowName]]=true
        //debugger
    })
    colVals=Object.getOwnPropertyNames(colVals).sort()
    rowVals=Object.getOwnPropertyNames(rowVals).sort()
    sparcs.table={colVals:colVals,rowVals:rowVals,tbl:tb,tds:[]} // mapping table to sparcs object
    // table header
    var tbh = document.createElement('thead') // head of the counts table
    tb.appendChild(tbh)
    var th0 = document.createElement('th') // corner cell
    tbh.appendChild(th0)
    th0.innerHTML=colName+'<br>_______<br>'+rowName
    th0.style.color='maroon'
    th0.id="cornerth0"
    colVals.forEach(function(c){
        var th = document.createElement('th')
        tbh.appendChild(th)
        tbh.style.color='navy'
        th.textContent=c
        th.style.cursor='pointer'
        th.onclick=function(){
            cmdSide.innerHTML='<div id="plotlyBarChartDiv"></div>'
            var col=this.textContent
            var i = sparcs.table.colVals.indexOf(this.textContent)
            sparcs.clicked=this
            var title = selectVar1.value+' for '+col+' ('+countySelect.value+' '+yearSelect.value+')'
            if((!filterMoreDiv.hidden)&&(filterInput.style.color!=='silver')){
                title += '<br><span style="font-size:small"> where '+filterInput.value+'</span>'
            }

            if(selectVar1.value!=="zip_code_3_digits"){
                Plotly.newPlot('plotlyBarChartDiv',
                    [
                      {
                        x: sparcs.hideOtherCols(sparcs.table.tds
                            .map(function(td){
                                return parseInt(td[i].textContent)
                            }).filter(function(vals,r){
                                return !sparcs.table.trs[r].hidden
                            })
                          ),
                        y: sparcs.hideOtherCols(sparcs.hideOtherCols(sparcs.table.rowVals))
                           .filter(function(vals,r){
                                return !sparcs.table.trs[r].hidden
                            }),
                        orientation: 'h',
                        type: 'bar'
                      }
                    ],
                    {
                        height:cmd.clientHeight+50,
                        title:title,
                        xaxis: {
                            title: 'patient count'
                        }
                    }
                )
            }else{ // plot choropleth because rwos are 3-digit zip codes
                if(!sparcs.map){
                    $.getScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyBujrQMOlux6Rgmx9DTPhQGetcyTZZbXbs&callback=sparcs.initMap');
                }else{
                    sparcs.initMap()
                }
                
                /*
                Plotly.newPlot('plotlyBarChartDiv',
                    [{
                        type: 'choropleth'
                    }],
                    {}
                  )
                */
                //debugger
            }
                
            mathbiol.msg('plot '+selectVar1.value+' for '+col)
        
        }
        
    })
    var tbd = document.createElement('tbody') // body of the counts table
    tb.appendChild(tbd)
    sparcs.table.trs=[]
    rowVals.forEach(function(r,i){
        sparcs.table.tds[i]=[]
        var tr = document.createElement('tr')
        sparcs.table.trs[i]=tr
        tbd.appendChild(tr)
        var th = document.createElement('th') // row label
        tr.appendChild(th)
        th.textContent=r
        colVals.forEach(function(c,j){
            var td = document.createElement('td')
            td.textContent="0"
            tr.appendChild(td)
            td.align="center"
            sparcs.table.tds[i][j]=td
        })
        th.i = i
        th.r=r
        th.style.cursor='pointer'
        th.style.color='green'
        th.onclick=function(){
            var i = this.i
            var y = Object.keys(sparcs.table.tds[i]).map(function(k){
                return parseInt(sparcs.table.tds[i][k].textContent)
            })
            // assemble plot
            cmdSide.innerHTML='<div id="plotlyBarChartDiv"></div>'
            sparcs.clicked=this
            var title = this.r+' by '+selectVar2.value+' ('+countySelect.value+' '+yearSelect.value+')'
            if((!filterMoreDiv.hidden)&&(filterInput.style.color!=='silver')){
                title += '<br><span style="font-size:small"> where '+filterInput.value+'</span>'
            }
            Plotly.newPlot('plotlyBarChartDiv',
                [
                  {
                    x: sparcs.hideOtherCols(sparcs.table.colVals),
                    y: sparcs.hideOtherCols(y),
                    type: 'bar'
                  }
                ],
                {
                    height:cmd.clientHeight+50,
                    title:title,
                    yaxis: {
                        title: 'patient count'
                    }
                }
            )
            mathbiol.msg('plot '+this.r+' by '+selectVar2.value)
            //plotlyBarChartDiv.innerHTML=''
            //Plotly.newPlot('plotlyBarChartDiv', data);
        }
    })
    // Fill table
    x.forEach(function(xi){
        var i = rowVals.indexOf(xi[rowName])
        var j = colVals.indexOf(xi[colName])
        var url = sparcs.urls[yearSelect.value].url+'.csv'
        var q = '?hospital_county='+countySelect.value
        q += '&'+selectVar1.value+'='+rowVals[i]+''
        if(selectVar2.value!=="hospital_county"){ // in case one is aggregating results as a single column
            q += '&'+selectVar2.value+'='+colVals[j]+''
        }
        if(!q.match('undefined')){
            sparcs.table.tds[i][j].innerHTML='<a href="'+url+q+'" target="_blank">'+xi.count+'</a>'
        }
        
    })
    th0.style.cursor='pointer'
    th0.onclick=function(){
        var traces = sparcs.table.rowVals.map(function(r,i){
            return {
                x:sparcs.hideOtherCols(sparcs.table.colVals),
                y:sparcs.hideOtherCols(sparcs.table.tds[i].map(function(td){return parseInt(td.textContent)})),
                name:r,
                type:'bar'
            }
        })

        traces=traces.filter(function(tc,i){ // hide hidden traces
            return !sparcs.table.trs[i].hidden
        })

        //debugger

        cmdSide.innerHTML='<div id="plotlyBarChartDiv"></div>'
        sparcs.clicked=this
        var title = selectVar1.value+' vs '+selectVar2.value+' ('+countySelect.value+' '+yearSelect.value+')'
        if((!filterMoreDiv.hidden)&&(filterInput.style.color!=='silver')){
            title += '<br><span style="font-size:small"> where '+filterInput.value+'</span>'
        }
        Plotly.newPlot('plotlyBarChartDiv',traces,{
            barmode:'stack',
            height:cmd.clientHeight+50,
            title:title,
            yaxis: {
                title: 'patient count'
            }

        })
        mathbiol.msg('plot '+selectVar1.value+' vs '+selectVar2.value)
        //debugger
    }

    return tb
    //debugger
}

sparcs.clickAgain=function(){
    // start by refreshing table hides
    if((constrainRows.style.color!=='silver')&&(constrainRows.value.length>0)){
        constrainRows.onkeyup()
    }
    if((constrainCols.style.color!=='silver')&&(constrainCols.value.length>0)){
        constrainCols.onkeyup()
    }
    
    if(sparcs.clicked){
        if(sparcs.clicked.id==="cornerth0"){
            sparcs.clicked.click()
        }else{
            sparcs.toArray(document.querySelectorAll('th'))
              .filter(function(th){return th.textContent.toLowerCase()===sparcs.clicked.textContent.toLowerCase()})
              .forEach(function(th){ // just should be just one, or none
                  th.click()
                  console.log('clicked automatically on ',th) // let's track it here
              })
        }
    }   
}

sparcs.count=function(){
    var c=0;
    y={total:0}
    sparcs.years.forEach(function(yr){
        y.total += sparcs.urls[yr].count
        y[yr] = sparcs.urls[yr].count
    })
    return JSON.stringify(y,null,3)
}

sparcs.youtube=function(){
    window.open('https://www.youtube.com/watch?v=NZkJeT6R_H4')
    return 'webcast demo use of the sparcs package opened in new window'
}

sparcs.zip3=function(){
    console.log('loading 3-digit zip code shape files ...')
    sparcs.getJSON('/sparcs/zip3.geojson')
      .then(function(x){
          sparcs.zip3.geometry={}
          x.features.forEach(function(xi){
              if(!sparcs.zip3.geometry[xi.properties.ZIP]){
                  sparcs.zip3.geometry[xi.properties.ZIP]={coordinates:[]}
              }
              sparcs.zip3.geometry[xi.properties.ZIP].coordinates=sparcs.zip3.geometry[xi.properties.ZIP].coordinates.concat(xi.geometry.coordinates)
              //debugger

          })
          
          y=x;console.log('... shapes loaded')
       })
}

sparcs.initMap=function(){
    // set default map center as Suffolk county map center
    if(sparcs.map){
        sparcs.initMap.current_zoom = sparcs.map.zoom
        sparcs.initMap.current_center = {lat:sparcs.map.getCenter().lat(),lng:sparcs.map.getCenter().lng()}
    }else{
        sparcs.initMap.current_zoom = 8
        sparcs.initMap.current_center = sparcs.initMap.current_center || {lat: 40.9332373, lng: -72.7924525};
    }
    plotlyBarChartDiv.style.height=cmd.clientHeight+50
    sparcs.map=new google.maps.Map(document.getElementById('plotlyBarChartDiv'),{
        // set default center as in Suffolk county :
        //center: {lat: 40.9332373, lng: -72.7924525},
        center: sparcs.initMap.current_center,
        scrollwheel: false,
        zoom: sparcs.initMap.current_zoom
    });
    console.log('clicked:',sparcs.clicked)
    
    // extract vizible data
    var ind = []
    var v1 = [] // zip code values as variable 1
    sparcs.table.trs.forEach(function(tr,i){
        if(!tr.hidden){
            let v = $('th',tr)[0].textContent || "undefined"
            if(v.match(/^\d+$/)){ // only numbers
                v1.push(v)
                ind.push(i)
            }
            
        }
    })
    var j = sparcs.table.colVals.indexOf(sparcs.clicked.textContent)
    // counts for variable 2, the jth column
    var v2 = ind.map(function(i){
        return parseInt(sparcs.table.tds[i][j].textContent)
    })
    var v2max=v2.reduce(function(a,b){if(b>a){return b}else{return a}})
    var v2norm=v2.map(function(v){return v/v2max})
    // ready for polygons
    sparcs.polygons={}
    var polygons=v1.map(function(v,zi){
        console.log('zip3=',v)
        sparcs.polygons[v]=[] // v = zip3
        console.log(v,sparcs.zip3.geometry[v])
        sparcs.zip3.geometry[v].coordinates.forEach(function(g,i){
            // get the individual polygon 
            var poly=g.map(function(gi){
                return {lat:gi[1],lng:gi[0]}
            })
            // plot ith polygon for v zip3
            sparcs.polygons[v][i]=new google.maps.Polygon({
                paths: poly,
                fillColor:sparcs.color(v2norm[zi])
            })
            sparcs.polygons[v][i].setMap(sparcs.map)
            //console.log(v,JSON.stringify(poly))

            

            4

        })
        4
    })


    //debugger
}

sparcs.cPdf=function(x,u,s){
    u=u||0;
    s=s||1;
    return Math.round(255*(1/(s*Math.sqrt(2*Math.PI)))*(Math.exp((-Math.pow((x-u),2))/(2*Math.pow(s,2))))/(1/(s*Math.sqrt(2*Math.PI))))
}

sparcs.color=function(val){
    if(Array.isArray(val)){
        return val.map(function(v){
            return sparcs.color(v)
        })
    }else{val = val*255
        return 'rgb('+sparcs.cPdf(val,255,35)+','+sparcs.cPdf(val,0,35) +','+sparcs.cPdf(val,100,35)+')'
    }
}




sparcs()

if(typeof(mathbiol)){

    mathbiol.sparcs=function(cmd){
        if(!cmd){
            return '"sparcs" command is under development, do "help sparcs" for more'
        }
    }
    mathbiol.sparcs.count = sparcs.count
    mathbiol.sparcs.about='New York Statewide Planning and Research Cooperative System (<a href="https://www.health.ny.gov/statistics/sparcs/" target="_blank">SPARCS</a>)'
    var typeCmd=function(that){
        mathbiol.sys.cmdSlow(that.textContent+'()')
    }
    mathbiol.sparcs.help=function(){
        var h = 'This command was loaded as part of the <a href="https://github.com/mathbiol/sparcs" target="_blank">"sparcs" module <i class="fa fa-github-alt" aria-hidden="true"></i></a>'
        h +=' developed to analyse the public data of New York Statewide Planning and Research Cooperative System (<a href="https://www.health.ny.gov/statistics/sparcs/" target="_blank">SPARCS</a>).'
        h +='<br><b style="color:maroon"> SPARCS Methods</b>:'
        h +='<li><span style="color:yellowgreen;background-color:black;cursor:pointer" onclick="typeCmd(this)">sparcs.count</span> counts patient entries per year, same as "count sparcs".</li>'
        h +='<li><span style="color:yellowgreen;background-color:black;cursor:pointer" onclick="typeCmd(this)">sparcs.help</span> the function operated by "help sparcs".</li>'
        h +='<li><span style="color:yellowgreen;background-color:black;cursor:pointer" onclick="typeCmd(this)">sparcs.youtube</span> opens 10 min screencast in new window. Same as "youtube sparcs"</li>'       
        h +='<li>...</li>'
        setTimeout(function(){
            mathbiol.msg(mathbiol.sparcs.about)
        },200)
        return h
    }
    mathbiol.sparcs.youtube=sparcs.youtube
    
}