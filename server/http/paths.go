package main

import (
	"path"
	"strconv"
)

//Functions for sat data paths (single task and worker)
//Gets key (path + filename)
func (sat *Sat) GetKey() string {
  return path.Join(sat.GetPath(), sat.Task.getFilename())
}
//Gets path only
func (sat *Sat) GetPath() string {
  return path.Join(sat.Task.getSubmitDir(),
    sat.User.UserId)
}
//Gets path from parameters
func GetSatPath(projectName string, taskId string,
  userId string) string {
  return path.Join(getSubmitDir(projectName, taskId),
    userId)
}
//Gets path for assignment from parameters
func GetAssignmentPath(projectName string, taskId string,
  userId string) string {
    return path.Join(getAssignmentDir(projectName, taskId),
    userId)
}


//Functions for task data paths (sync)
//Gets key (path + filename)
func (task *TaskData) GetKey() string {
  return path.Join(task.GetPath(), task.getFilename())
}
//Gets path
func (task *TaskData) GetPath() string {
  return path.Join(task.getSubmitDir(),
    "sync")
}
//Gets path from parameters
func GetTaskPath(projectName string, taskId string) string {
  return path.Join(getSubmitDir(projectName, taskId),
    "sync")
}

//Helper functions
//Gets the filename from the task
func (task *TaskData) getFilename() string {
  return strconv.FormatInt(task.Config.SubmitTime, 10)
}
//Gets submissions directory from task
func (task *TaskData) getSubmitDir() string {
  return getSubmitDir(task.Config.ProjectName, task.Config.TaskId)
}
//Gets submissions directory from parameters
func getSubmitDir(projectName string, taskId string) string {
    return path.Join(projectName, "submissions", taskId)
}
//Gets assignment directory from parameters
func getAssignmentDir(projectName string, taskId string) string {
    return path.Join(projectName, "assignments", taskId)
}
