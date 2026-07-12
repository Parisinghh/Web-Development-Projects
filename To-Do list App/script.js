const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

function addTask(){

    const taskText = taskInput.value.trim();

    if(taskText === ""){
        alert("Please enter a task!");
        return;
    }

    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const span = document.createElement("span");
    span.textContent = taskText;

    checkbox.addEventListener("change",function(){
        span.classList.toggle("completed");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "🗑";
    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click",function(){
        li.remove();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);

    taskInput.value = "";
    taskInput.focus();
}

taskInput.addEventListener("keypress",function(event){
    if(event.key === "Enter"){
        addTask();
    }
});