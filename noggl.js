var TogglClient = require('toggl-api');
var toggl = new TogglClient({apiToken: '06fdad0b2ab8a31ec7c8401eeec95cc6'});
var workspaceID

var info = {}

toggl.getWorkspaces( (err,report) => {
	if(err) { console.error(err) }

	toggl.detailedReport({'workspace_id':report[0].id}, (err,report) => {
		if(err) { console.error(err) }
		addTaskInfo(report)
		console.log(info)
	})
})

function addTaskInfo(report){
	report.data.forEach( task => {
		// if no project specified label 'other'
		var project = task.project?task.project:"other"
		// create project if it dosen't already exist
		if(!info[project]) info[project] = {}
		// if task already exists then skip
		if(!info[project][task.id]){
			info[project][task.id] = {
				name:task.description,
				user:task.user,
				start:task.start,
				end:task.end,
				dur:task.dur
			}
		}
	})
}
