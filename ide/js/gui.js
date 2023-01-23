try{
	chuckEditor.setValue(localStorage.getItem("code"))
	chuckEditor.gotoLine(0, 0, true)
	chuckEditor.clearSelection()
	} catch (exceptionVar) {
     
	}

function setUI()
{
	let buttons = []
	let vsliders = []
	let hsliders = []
	let chkboxs = []
    	
	let code = chuckEditor.getValue()
	let lines = code.split("\n")
	for(var i = 0; i < lines.length; i++){
		var temp = lines[i].split(" ")
		for(var j = 0; j < temp.length; j++){
			if(temp[j] === "global"){
				if(temp[j+1] === "float"){
					vsliders.push(temp[j+2].replace(';',''))
				}
				if(temp[j+1] === "Event"){
					buttons.push(temp[j+2].replace(';',''))
				}
				if(temp[j+1] === "int"){
					if(temp[j+3] === "//gui" && temp[j+4] === "bool"){
						chkboxs.push(temp[j+2].replace(';',''))
					} else {
						hsliders.push(temp[j+2].replace(';',''))
					}
				}
			}
		}
	}
		
	var Panel
		
	try{
		Panel = document.getElementById("panel")
	} catch (exceptionVar) {

	}

	let declaring = ""
		
	for(var i = 0; i < vsliders.length; i++){
		declaring += "let "+vsliders[i]+" = 0;\n"
	}

	for(var i = 0; i < chkboxs.length; i++){
		declaring += "let "+chkboxs[i]+" = false;\n"
	}
		
	for(var i = 0; i < hsliders.length; i++){
		declaring += "let "+hsliders[i]+" = 0;\n"
	}
		
	let p5header = "//This code as autogenerated by webChuckUI\n"
	declaring += `document.addEventListener("touchmove", (e) => {}, { passive: false });

let canvas

function setup() {
	cnv = createCanvas(${Panel.offsetWidth}, ${Panel.offsetHeight})
	cnv.id("p5")
	cnv.parent("panel")
	cnv.style('display','none');
}
function windowResized() {
    resizeCanvas(${Panel.offsetWidth}, ${Panel.offsetHeight})
	//cnv.position(${Panel.getBoundingClientRect().left},${Panel.getBoundingClientRect().top})
}
function draw() {
background(255);
fill(0);
textSize(6);

`		
	//TODO: - Make all measures relative to canvas not fixed px
	//      - Set main grids to fit some posible (general) scenarios

	for(var i = 0; i < vsliders.length; i++){
		declaring += "fill(0)\n"
		//declaring += 'text("'+vsliders[i].slice(0, 8)+'",'+((35*i)+(hsliders[i] ? 240 : 20))+",80);\n"
		//declaring += vsliders[i] + " = vslider(" + vsliders[i]+","+((35*i)+(hsliders[i] ? 250 : 30))+",90,"+Panel.offsetHeight*0.7+",0,1);\n"
		declaring += 'text("'+vsliders[i].slice(0, 8)+'",'+((35*i)+(chkboxs[i] ? Math.ceil(Panel.offsetWidth*0.6) : 20))+",80)\n"
		declaring += vsliders[i] + " = vslider(" + vsliders[i]+","+((35*i)+(chkboxs[i] ? Math.ceil(Panel.offsetWidth*0.6) : 30))+",90,"+Math.ceil(Panel.offsetHeight*0.7)+",0,1)\n"
	}

	for(var i = 0; i < hsliders.length; i++){
		declaring += "fill(0);\n"
		declaring += 'text("'+hsliders[i].slice(0, 8)+'",20,'+((35*i)+85)+");\n"
		declaring += hsliders[i] + " = slider(" + hsliders[i]+",20,"+((35*i)+90)+",200,0,100);\n"
	}

	for(var i = 0; i < chkboxs.length; i++){
		declaring += "fill(0)\n"
		declaring += 'text("'+chkboxs[i].slice(0, 8)+'",'+ ((i%8*40)+10) + ","+(i < 8 ? 10 : 50)+")\n"
		declaring += `fill(${chkboxs[i]} ? 0 : 255)\n`
		declaring += chkboxs[i] + " = checkbox("+chkboxs[i]+","+ ((i%8*40)+10) + ","+ (i < 8 ? 10 : 50) +",30,30)\n"
	}

	for(var i = 0; i < buttons.length; i++){
		declaring += "fill(0);\n"
		declaring += 'text("'+buttons[i].slice(0, 8)+'",'+ ((i*60)+10) + ",10)\n"
		declaring += "fill(255);\n"
		declaring += "if(button(" + ((i*60)+10) + ",10,50,50)){"+"theChuck.broadcastEvent("+'"'+buttons[i]+'")}\n'
	}
		
	declaring += "activateGUI();\n"
	declaring += `if(mouseIsPressed) {\n`
	declaring += 'if(theChuck){\n'

	for(var i = 0; i < vsliders.length; i++){
		declaring += 'theChuck.setFloat("'+vsliders[i]+'",'+vsliders[i]+")\n"
	}

	for(var i = 0; i < hsliders.length; i++){
		declaring += 'theChuck.setInt("'+hsliders[i]+'",int('+hsliders[i]+"))\n"
	}

	for(var i = 0; i < chkboxs.length; i++){
		declaring += 'theChuck.setInt("'+chkboxs[i]+'",int('+chkboxs[i]+"))\n"
	}

	declaring += '}\n}\n}'
	//TODO fix reposition and size on windowResize
		
	var script = p5header + declaring
	// Debug autogenerated code here:
	//console.log(script)
	return script
}
    	
function UI(){
	localStorage.setItem("code", chuckEditor.getValue())
	window.location.reload(true)
}

eval(setUI())
    
let graphicStatus = 2

function drawing(s){

	var console = document.getElementById("console")
	var visCanvas = document.getElementById("canvas")
	var p5can = document.getElementById("p5")
	graphicStatus = s

  	switch(graphicStatus){
		case 0:
			console.style.display = 'none'
			visCanvas.style.display = 'none'
			p5can.style.display = 'block'
		break;
		case 1:
			console.style.display = 'none'
			p5can.style.display = 'none'
			visCanvas.style.display = 'block'
		break;
		case 2:
			visCanvas.style.display = 'none'
			p5can.style.display = 'none'
			console.style.display = 'block'
		break;
	}
}
  
