const module = {
    createForm:(root, val)=>{
        let close = document.createElement('a');
        close.href='#';
        close.classList.add('close__input');
        close.textContent = 'x';
        let input = document.createElement('input');
        
        if (val){
            root.innerHTML = "";
            root.classList.add('hasForm');
            input.value =val;
            root.appendChild(input);
            root.appendChild(close);
        } else {
            let li = document.createElement('li');
            li.classList.add('hasForm','close');
            input.placeholder = 'Add new task';
            li.appendChild(input);
            li.appendChild(close);
            root.appendChild(li);
        }
    },
    createTR:(datas, tbody)=>{
        tbody.innerHTML = "";
        datas.forEach(data=>{
            if (!data.config){
                data.config = {time: ""};
            } else {
                data.config.time = `time: 00:${data.config.min}:${data.config.sec}`
            }
            let str = `
                <p>${data['value']}</p>
                <span class=remaining>${data.config.time}</span>
                <div id='controls' class='control hide-controls'>
                    <a href=# id=start class='control-control__start'>start</a>
                    <a href=# id=edit class='control-control__edit'>edit</a>
                    <a href=# id=trash class='control-control__trash'>trash</a>
                </div>

            `;
            let li = document.createElement('li');
            li.classList.add('close');
            li.id = data['id'];
            li.innerHTML = str;
            tbody.appendChild(li);
        })
    },
    replaceForm:(data)=>{
        if (!data.config){
            data.config = {time: ""};
        } else {
            data.config.time = `time: 00:${data.config.min}:${data.config.sec}`
        }
        data.row.innerHTML = "";
        let str = `
                <p>${data['value']}</p>
                <span class=remaining>${data.config.time}</span>
                <div id='controls' class='control hide-controls'>
                    <a href=# id=start class='control-control__start'>start</a>
                    <a href=# id=edit class='control-control__edit'>edit</a>
                    <a href=# id=trash class='control-control__trash'>trash</a>
                </div>
            `;
        data.row.innerHTML = str;
        data.row.id = data['id'];
    },
}
class AppModel{
    constructor(name, def){
        this.name = name;
        this.defaults = def;
    }
    controller(){
        return {
            _setup:()=>{
                if (localStorage[this.name] == undefined){
                    localStorage.setItem(this.name, JSON.stringify(new Array));
                }
            },
            _closeDB:(db)=>{
                return new Promise((resolve,reject)=>{
                    localStorage.setItem(this.name, JSON.stringify(db));
                    resolve();
                })
            },
            _openDB:()=>{return JSON.parse(localStorage[this.name])},
            push:(data)=>{
                let db = this.controller()._openDB();
                db.push(data);
                return this.controller()._closeDB(db);
            },
            put:(obj)=>{
                let db = this.controller()._openDB();
                db = db.map(item=>{
                    if (+item.id == +obj.id){
                        item = obj;
                    }
                    return item;
                })
                return this.controller()._closeDB(db); 
            },
            trash:(id)=>{
                let db = this.controller()._openDB();
                db = db.filter(item=>{
                    return +item['id'] != +id;
                })
                return this.controller()._closeDB(db);
            },
            read:()=>{
                return {
                    datas:()=>{
                        return JSON.parse(localStorage[this.name]);
                    },
                }
            },
            sync:()=>{
                let target, update, db, item, has;
                target = this.controller()._openDB();
                update = this.defaults;
                db = update.map(u=>{
                    has = target.filter(t=>{
                        u.id==t.id
                    })
                    if (has.length){
                        item = has;
                    } else {
                        item = u;
                    }
                    return item;
                })
                return this.controller()._closeDB(db);
            },
        }
    }
}
class App{
    constructor(){
        this.timer = new Timer().controller();
        this.model = ()=>{return new AppModel('todo').controller()};
        this.model()._setup();
    }
    view(){
        return {
            render: (datas)=>{
                module.createTR(datas, document.getElementById('list'));
            },
            add:(handler)=>{
                let tbody = document.getElementById('list');
                document.getElementById('add').addEventListener('click', (e)=>{
                    let mode = tbody.getAttribute('name');
                    if (!(mode)){
                        module.createForm(tbody);
                        tbody.setAttribute('name', 'appending');
                        handler();
                    }
                });
            },
            enter:(handler)=>{
                document.addEventListener('keypress', (e)=>{
                    if (e.keyCode == 13){
                        let tbody = document.getElementById('list');
                        let inputs = tbody.querySelectorAll('input');
                        let obj = Array.from(inputs).map(input=>{
                            getParent(input, {type:'tag', selector: 'LI'}).classList.remove('hasForm');
                            return {
                                value: input.value,
                                row: getParent(input, {type:'tag', selector:'LI'}),
                                mode: tbody.getAttribute('name'),
                                id: getParent(input, {type:'tag', selector:'LI'}).id,
                            }
                        })
                        tbody.setAttribute('name', "");
                        handler(obj);
                    }
                })
            },
            rowClick:(handler)=>{
                let parent = document.getElementById('list');
                let setting = document.getElementById('setting');
                parent.addEventListener('click', (e)=>{
                    if (setting.classList.contains('setting-close')){
                        if (!parent.querySelector('.hasForm')){
                            radio({
                                parent: getParent(e.target, {type:'tag',selector:'UL'}),
                                activeChild: getParent(e.target, {type: 'tag', selector:'LI'}),
                                classes: {show:'open', hide:'close', exclude:'hasForm', active:'todo-active'},
                                children: parent.querySelectorAll('li'),
                            });
                            if(e.target.parentElement.id == 'controls'){
                                let obj = {
                                    id: e.target.id,
                                    tr: getParent(e.target, {type:'tag', selector:'LI'}),
                                    controls: e.target.parentElement,
                                    value: getParent(e.target, {type:'tag', selector:'LI'}).querySelector('p').textContent,
                                }
                                handler(obj);
                            }
                        }
                    }
                })
            },
            closeInput:(handler)=>{
                let closeInput = document.querySelector('.close__input');
                if (closeInput){
                    closeInput.addEventListener('click', (e)=>{
                        handler({
                            value: closeInput.previousSibling.value,
                            row: getParent(closeInput.previousSibling, {type:'tag', selector:'LI'}),
                            mode: getParent(closeInput.previousSibling, {type:'id', selector:'list'}).getAttribute('name'),
                            id: getParent(closeInput.previousSibling, {type:'tag', selector:'LI'}).id,
                        });
                    });
                }
            },
        }
    }
    controller(){
        return {
            render:()=>{
                let datas = this.model().read().datas();
                this.view().render(datas);
            },
            closeInputHandler:(obj)=>{
                if(obj.mode == 'editing'){
                    //replace form
                    let pulled = this.model().read().datas().filter(row=>{
                        return obj.row.id == row.id;
                    })[0];
                    Object.assign(obj, pulled)
                    module.replaceForm(obj);
                    obj.row.parentElement.setAttribute('name',"");
                    setTimeout(()=>{obj.row.classList.remove('hasForm')}, 100);    
                }else{
                    //remove element
                    obj.row.parentElement.setAttribute('name',"");
                    setTimeout(()=>{obj.row.remove()},100);
                }                
            },
            addHandler:()=>{
                this.view().closeInput(this.controller().closeInputHandler);
            },
            enterHandler:(obj)=>{
                let id = 0;
                obj.forEach(item=>{
                    let method;
                    if (!item.id){
                        id += 1;
                        item.id = new Date().getTime() + id;
                    }
                    // if (item.duration){
                    //     item.duration = 25;
                    // }
                    let fields = ['value', 'id', 'duration'];
                    let data = filterObj(item, fields);
                    if (item.mode == 'appending'){
                        method = this.model().push(data);
                    } else if(item.mode == 'editing'){
                        method = this.model().put(data);
                    };
                    method.then(()=>{   
                        module.replaceForm(item);
                    })
                })
            },
            trashHandler:(obj)=>{
                promised(this.model().trash(obj.tr.id))
                    .then(()=>{
                        setTimeout(()=>{
                            obj.tr.classList.add('todo-delete');
                        }, 100);
                        setTimeout(()=>{
                            obj.tr.remove();
                        }, 1000);
                    })
            },
            editHandler:(obj)=>{
                obj.tr.parentElement.setAttribute('name', 'editing');
                module.createForm(obj.tr, obj.value);
                this.view().closeInput(this.controller().closeInputHandler);
            },
            startHandler:(obj)=>{
                this.timer.render(obj);
            },
            rowClickHandler:(obj)=>{
                let id = obj.id;
                switch (id){
                    case 'trash':
                        this.controller().trashHandler(obj);
                        break;
                    case 'start':
                        this.controller().startHandler(obj);
                        break;
                    case 'edit':
                    this.controller().editHandler(obj);
                    break;
                }
            },
            activateEvents:()=>{
                this.view().add(this.controller().addHandler);
                this.view().rowClick(this.controller().rowClickHandler);
                this.view().enter(this.controller().enterHandler);
            },
            listen:()=>{
                this.controller().activateEvents();
                this.controller().render();
            },
        }
    }
}
class Timer{
    constructor(){
        this.duration = 25000;
        this.model = ()=>{return new AppModel('todo').controller()};
        this.model()._setup();
    }
    view(){
        return {
            render:(root, data)=>{
                let str = `
                    <section id='timer-container' data-id=${data.tr.id} class='timer__container'>
                        <div id=timer class=timer>
                            <div id='close-container' class='timer_close_container'>
                                <a href=# id=close class= 'close hide-close'>x</a>
                            </div>
                            <div class='task_name_container'>
                                <p id='task-name' class='task_name'>${data.value}</p>
                            </div>
                            <div id=time class=time>
                                <span id=minutes class=minutes>${data.min}</span>
                                <span>:</span>
                                <span id=seconds class=seconds>${data.sec}</span>
                            </div>
                            <div id='timer-controls' class='timer-controls'></div>
                        </div>
                    </section>
                `;
                root.appendChild(toHTML(str));
            },
            renderTimer:(handler)=>{
                let minutes, seconds, close, timer, count, counter, second;
                minutes = document.getElementById('minutes');
                seconds = document.getElementById('seconds');
                close = document.getElementById('close');
                timer = ()=>{
                    if (seconds.innerHTML == 59){
                        count = (+minutes.innerHTML == 0)? 59: (+minutes.innerHTML -1)
                        minutes.innerHTML = (second < 10) ? `0${count}`: count;
                    }
                    if ((minutes.innerHTML != 0) || seconds.innerHTML != 0){
                        counter = setTimeout(()=>{
                            second = (seconds.innerHTML == 0) ? 59:(+seconds.innerHTML -1);
                            seconds.innerHTML = (second < 10 && second > -1) ? `0${second}`: second;
                            timer();
                        }, 1000)
                        close.setAttribute('data-timerID', counter);
                    } else {
                        handler();
                    }
                };timer();
            },
            clickControl:(handler)=>{
                document.getElementById('timer-controls').addEventListener('click', (e)=>{
                    let obj = {
                        timerID: document.getElementById('close').getAttribute('data-timerID'),
                        min: document.getElementById('minutes'),
                        sec:document.getElementById('seconds'),
                        id: document.getElementById('timer-container').getAttribute('data-id'),
                        control: e.target.id,
                    }
                    handler(obj);
                });
            },
            toggleClose:()=>{
                toggler({
                    trigger: true,
                    target: [
                        {selector: document.getElementById('close'), classes:{show: 'show-close', hide: 'hide-close'}},
                    ],
                })
            },
            close:(handler)=>{
                document.getElementById('close').addEventListener('click', (e)=>{
                    handler({
                        container:document.getElementById('timer-container'),
                        id:e.target.getAttribute('data-timerID'),
                    })
                })
            },
            renderControl:(name)=>{
                let template = {
                    pause: `<a id=pause href=#>&#10679</a>`,
                    play: `<a id=play href=#>&#10689</a>`,
                    restart: `<a id=restart href=#>&#10227</a>`,
                }
                document.getElementById('timer-controls').innerHTML = template[name];
            },
        }
    }
    controller(){
        return {
            render:(obj)=>{
                let pulled = this.model().read().datas().filter(row=>{
                    return obj.tr.id == row.id;
                })[0];
                if (localStorage.settings){
                    obj.min = JSON.parse(localStorage.settings)['duration'];
                } else {
                    obj.min = 10;
                }
                obj.sec='00';
                if ('config' in pulled){
                    obj.min = pulled['config']['min'];
                    obj.sec = pulled['config']['sec'];
                }
                
                this.view().render(document.getElementById('main-container'), obj);
                this.view().renderControl('pause');
                this.controller().activateEvents();
            },
            clickControlHandler:(obj)=>{
                switch (obj.control){
                    case 'pause':
                        this.controller().pauseHandler(obj);
                        break;
                    case 'play':
                        this.controller().playHandler(obj);
                        break;
                    case 'restart':
                        this.controller().restartHandler(obj);
                        break;
                }
            },
            pauseHandler:(obj)=>{
                this.view().toggleClose();
                let db = this.model()._openDB();
                obj.min = obj.min.innerHTML;
                obj.sec = obj.sec.innerHTML;
                let config = {config: obj};
                db = db.map(item=>{
                    if (+item.id == +obj.id){
                        item = Object.assign(item, config);
                    }
                    return item;
                })
                this.model()._closeDB(db);
                clearTimeout(obj.timerID);
                this.view().renderControl('play');
            },
            playHandler:(obj)=>{
                this.view().toggleClose();
                this.view().renderTimer(this.controller().renderTimerHandler);
                this.view().renderControl('pause');
            },
            restartHandler:(obj)=>{
                let duration = JSON.parse(localStorage.settings)['duration'];
                let todoID = obj.id;
                obj.min.textContent = duration;
                obj.sec.textContent = '00';
                this.view().renderTimer(this.controller().renderTimerHandler);
                this.view().renderControl('pause');
                this.view().toggleClose();
            },
            closeHandler:(obj)=>{
                clearTimeout(obj.id);
                obj.container.remove();
                module.createTR(this.model().read().datas(), document.getElementById('list'))
            },
            renderTimerHandler:(obj)=>{
                this.view().toggleClose();
                this.view().renderControl('restart');
            },
            activateEvents:()=>{
                this.view().clickControl(this.controller().clickControlHandler);
                this.view().renderTimer(this.controller().renderTimerHandler);
                this.view().close(this.controller().closeHandler);
            },
        }
    }
}
class Theme{
    model(){
        return {
            'blue ocean': {
                "--header-background": "hsl(229.2, 100%, 15.3%)",
                "--main-background": "hsl(203.9, 63.1%, 38.2%)",
                "--row-background": "hsl(202.3,49.2%,49.4%)",
                "--body-background": "hsl(204,58.8%,40%)",
                "--controls-background": "hsl(75,10.7%,56.1%)",
                "--overlay-background": "rgba(0,0,0,0.2)",
                "--timer-background": "hsl(47,100%,49.6%)",
                "--time-background": "hsl(236, 100%, 5.9%)",
                "--sidebar-background": "hsl(45.1, 100%,43.3%)",
                "--time-color": "hsl(202.5, 42.7%, 59.6%)",
                "--header-color": "hsl(84, 18.9%, 63.7%)",
                "--td-color": "hsl(220.2,86.3%,20%)",
                "--control-color":"hsl(48.5,97.6%,67.5%)",
                "--close-color":"hsl(50.8,100%,57.8%)"
            },
            'green ranger':{
                "--header-background": "#063500",
                "--main-background": "#25531a",
                "--row-background": "#d8d07d",
                "--td-color": "#4d568d",
                "--header-color": "#fd7e46",
            },
            'red dragon':{
                "--header-background": "#830000",
                "--main-background": "#dc0d00",
                "--row-background": "#ea1c52",
                "--td-color": "#4d568d",
                "--header-color": "#fd7e46",
            }
        }
    }
}
class Settings{
    constructor(){
        this.model()._db();
    }
    model(){
        return{
            _db:()=>{
                let db = new AppModel('pomodoro-setting', this.model().structure());
                let controller = db.controller();
                controller._setup();
                controller.sync();
                return controller;
            },
            structure:()=>{
                return [
                    {id:'theme', display:'Theme', tag:'select', src:['red dragon', 'blue ocean', 'green ranger']},
                    {id:'duration', display:'Duration', tag:"input", type:'number', value:25},
                ]
            },
        }
    }
    view(){
        return {
            clickSetting:(handler)=>{
                document.body.addEventListener('click', (e)=>{
                    e.preventDefault();
                    let container = document.querySelector('.sidebar__container');
                    if (container){
                        toggler({
                            trigger: (e.target.id == 'setting'),
                            target:[
                                {selector: container, classes:{show:'sidebar-open', hide:'sidebar-close'}},
                                {selector:document.getElementById('setting'), classes:{show:'setting-open', hide:'setting-close'}},
                            ],
                        })
                    } else {
                        if (e.target.id =='setting'){
                            handler();
                            setTimeout(()=>{
                                document.querySelector('.sidebar__container').classList.replace('sidebar-close', 'sidebar-open');
                                document.getElementById('setting').classList.replace('setting-close', 'setting-open');
                            },100)
                        }
                    }
                })
            },
            renderSidebar:(data)=>{
                let str =`
                    <ul class='setting__list'>
                        ${
                            data.map(item=>{
                                return `<li class='setting__row'>
                                    <span class='setting__label'>${item.display}</span>
                                    ${createFormElement(item)}
                                </li>`
                            }).join("")
                            
                        }
                        <input type='submit' value='submit' class='submit'></input>
                    </ul>
                `;
                document.querySelector('.sidebar__container').appendChild(toHTML(str));
            },
            renderContainer:(root)=>{
                let str =`
                    <div class='sidebar__container sidebar-close'>
                        <h2>Settings</h2>
                    </div>
                `;
                root.appendChild(toHTML(str));
            },
            submit:(handler)=>{
                document.querySelector('.setting__list .submit').addEventListener('click', (e)=>{
                    handler({
                        theme:document.getElementById('theme').value,
                        duration: document.getElementById('duration').value,
                    });
                })
            },
        }
    }
    controller(){
        return {
            clickSettingHandler:()=>{
                let data = this.model()._db().read().datas();
                this.view().renderContainer(document.getElementById('main-container'));
                this.view().renderSidebar(data);
                this.view().submit(this.controller().submitHandler);
            },
            submitHandler:(obj)=>{
                if (!obj.duration){
                    obj.duration = 25;
                }
                localStorage.setItem('settings', JSON.stringify(obj));
                obj = new Theme().model()[obj.theme];
                applyTheme(obj);
            },
            listen:()=>{
                this.view().clickSetting(this.controller().clickSettingHandler);
            },
        }
    }
}

const settings = new Settings();
settings.controller().listen();
const app = new App;
app.controller().listen();

if (localStorage.settings){
    let theme = new Theme().model()[JSON.parse(localStorage.settings)['theme']];
    applyTheme(theme);
}
