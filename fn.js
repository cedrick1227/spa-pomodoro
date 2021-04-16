function isEqual(a,b){
    return a == b;
}
function isArray(obj){
    return !!obj.map;
}
function isElement(obj){
    return !!obj.innerHTML;
}
function filterObj(obj, fields){
    return fields.reduce((accu,field)=>{
        accu[field] = obj[field];
        return accu;
    },{})
}
function toHTML(str){
    let div = document.createElement('div');
    div.innerHTML = str;
    return div.children[0];
}
function getChild(selector){
    try{
        let get = document.querySelectorAll(selector);
        return (get.length)?get:console.error(`"${selector}" is not found`);
    } catch(e){
        console.log(e);
    }
}
function applyTheme(obj){
    for (let key in obj){
        document.documentElement.style.setProperty(key, obj[key]);
    }
}
function getParent(base, obj){
    /*
    parse backward of the base
    obj = {selector: element|string|class|id, type:class|id|tag}
    */
   let type = obj.type, selector = obj.selector, test;
   let parse = () => {
       switch (type){
           case 'class':
               test = !(base.classList.contains(selector));
               break;
            case 'id':
                test = base.id != selector;
                break;
            case 'tag':
                test = base.tagName != selector;
       }
       if (test){
           if (base.tagName != 'HTML'){
               base = base.parentElement;
               parse();
           } else {
               return base;
           };
       }
   };parse();
   return base;
}
function toggler(obj){
    /**
     * obj = {
     *  trigger: 'bool',
     *  ally: obj{
     *      toToggle:element, element holding the modal
     *      target: targetElement,
     *      selector:object{selector: string|element, type:className|tag|id} 
     * },
     *  target: array[
     *      obj{selector:'string|element', class:object{show:'string', hide:'string'}}
     *  ]
     * }
     * it can be use in multilevel nav menu
     * it can serve as sliding modal with form in it
     * 
     * the toggling stops when the target element is within the modal
     */
    obj.target.forEach(item=>{
        let selector = item.selector;
        let classes = item.classes;
        let elements = (selector.innerHTML)?[selector]:document.querySelectorAll(selector);
        elements.forEach(element=>{
            if (obj.trigger){
                if (element.classList.contains(classes.show)){
                    element.classList.replace(classes.show, classes.hide);
                } else {
                    element.classList.replace(classes.hide, classes.show);
                }
            } else {
                if (element.classList.contains(classes.show)){
                    if ('ally' in obj){
                        if (!isEqual(obj.ally.toToggle, getParent(obj.ally.target,{
                            selector: obj.ally.selector,
                            type: obj.ally.type,
                        }))){
                            element.classList.replace(classes.show, classes.hide);
                        }
                    }
                }
            }
        })
    })
}
function radio(obj){
    /**
     * obj = {
     *  parent: element,
     *  activeChild: element,
     *  children: nodeList,
     *  classes: object,
     * }
     * it toggles the classes like a radio button
     */
    let children = obj.children;
    let parent = obj.parent;
    let classes = obj.classes;
    let activeChild = obj.activeChild;
    children.forEach(item=>{
        let itemClassList = item.classList;
        if (item.id == activeChild.id){
            if (itemClassList.contains(classes.exclude)){
                itemClassList.replace(classes.show, classes.hide);
                itemClassList.remove(classes.active);
            } else {
                if (itemClassList.contains(classes.show)){
                    itemClassList.replace(classes.show, classes.hide);
                    itemClassList.remove(classes.active);
                } else {
                    itemClassList.replace(classes.hide, classes.show);
                    itemClassList.add(classes.active);
                }
            }
        } else {
            itemClassList.replace(classes.show, classes.hide);
            itemClassList.remove(classes.active);
        }
    });
}
function promised(fn){
    return new Promise((resolve, reject)=>{
        fn;
        resolve();
    })
}
function createFormElement(object){
    let element;
    if (object.tag == 'input'){
        element = document.createElement('input');
        element.id = object.id;
        element.placeholder = object.display;
        element.type = object.type;
        element.value = object.value;
    } else if (object.tag == 'select') {
        element = document.createElement('select');
        element.id = object.id;
        object.src.forEach(item=>{
            let option = document.createElement('option');
            option.textContent = item;
            element.appendChild(option);
        })
    }
    let form = document.createElement('form');
    form.appendChild(element);
    return form.innerHTML;
}
