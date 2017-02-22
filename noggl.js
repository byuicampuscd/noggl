var TogglClient = require('toggl-api');
var toggl
var fs = require('fs')
var git = require('simple-git')()
var prompt = require('prompt')
var workspaceID
var path = './data.json'
var authPath = './auth.json'


function getOldData(){
	if(fs.existsSync(path)){
		git.pull()
		return JSON.parse(fs.readFileSync(path,'utf8'))
	}
	return {}
}

function getToken(callback){
	if(fs.existsSync(authPath)){
		callback(JSON.parse(fs.readFileSync(authPath,'utf8')))
	} else {
		prompt.start()
		console.log("I'm missing you API-token, please go copy it from your profile settings in toggl")
		prompt.get(['API token'], (err,result) => {
			result = {apiToken:result['API token']}
			callback(result)
			fs.writeFile(authPath,JSON.stringify(result), (err) => {
				if(err){console.error(err)}
			})
		})
	}
}

function getCurrentData(callback){
	toggl.getWorkspaces( (err,report) => {
		if(err) { console.error(err) }

		toggl.detailedReport({'workspace_id':report[0].id}, (err,report) => {
			if(err) { console.error(err) }
			callback(rearrangeData(report))
		})
	})
}

function rearrangeData(report){
	var adjusted = {}
	report.data.forEach( task => {
		// if no project specified label 'other'
		var project = task.project?task.project:"other"
		// create project if it dosen't already exist
		if(!adjusted[project]) adjusted[project] = {}
		// if task already exists then skip
		adjusted[project][task.id] = {
				name:task.description,
				user:task.user,
				start:task.start,
				end:task.end,
				dur:task.dur
			}
	})
	return adjusted
}

function push(){
	git.add(path)
	git.commit('auto commit')
	git.pull()
	git.push()
}

function diff(olds,news){
	for(var proj in news){
		if(!olds[proj]){
			console.log("Adding the '"+proj+"' project")
		} else {
			for(var task in news[proj]){
				if(!olds[proj][task]){
					console.log("Adding the '"+news[proj][task].name+"' task in '"+proj+"'")
				}
			}
		}
	}
}

function combine(olds,news){
	var union = JSON.parse(JSON.stringify(olds))
	for(var proj in news){
		if(!union[proj]) union[proj] = {}
		for(var task in news[proj]){
			union[proj][task] = news[proj][task]
		}
	}
	return union
}

function main(){
	getToken( apiToken => {
		toggl = new TogglClient(apiToken);
		var oldData = getOldData()
		getCurrentData( currentData => {
			diff(oldData,currentData)
			var data = combine(oldData,currentData)
			fs.writeFile(path,JSON.stringify(data), (err) => {
				if(err) console.error(err)
				push()
			})
		})
	})
}

main()
