import { moduleManager } from "../../../../instances";
import { setStorage, storageDat } from "../../../../storage";
import { createDiv, createElement, createInput, guiHolder, makeDraggable } from "../../../../utils/elementutils";
import { Category, Module } from "../../../module";
import { BindSetting, BoolSetting, ColorSetting, EnumSetting, NumSetting, StringSetting } from "../../../settings";

const moduleDiv = createDiv("invisHolder");

var modGui: HTMLDivElement | null;
var currentModGui: string | null = null;

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

guiHolder.appendChild(moduleDiv);
const categoryDivs = new Map<Category, HTMLDivElement>();

export function getBindSettingStr(setting: BindSetting) {
    return `BIND: ${setting.val || "NONE"}`;
}

export class GuiModule extends Module {
    static bindingSetting: BindSetting | null = null;
    static bindingSettingElm: HTMLElement;

    closeOnEscape = this.addBool("escapeclose", true, "closes the gui when you hit escape");
    // particles = this.addBool("particles", true, "WOAH DUDE");

    constructor() {
        super("gui", Category.CLIENT, "the gui");
        
        this.setDefaultBind("Escape");

        document.addEventListener("keydown", (e) => {
            if(e.keyCode == 27 && this.enabled.val && this.closeOnEscape.val && this.bind.val != "Escape") {
                this.disable();
            }
        });

        // this.particles.on("change", () => {
        //     this.tryRender();
        // });
    }

    onEnable(): void {
        guiHolder.style.display = "block";
        this.tryRender();
    }

    onDisable(): void {
        guiHolder.style.display = "none";
        if(modGui != null) {
            modGui.remove();
            modGui = null;
            currentModGui = null;
        }
    }

    renderGui(module: Module) {
        const guiDiv = createDiv("dispGui");
        const nameDiv = createDiv("settingDiv", "setTitle");
        // const borderStr = "rgba(1, 26, 54, 0.89)";

        // nameDiv.style["border-color" as any] = borderStr;
        nameDiv.textContent = `${module.name} : ${module.desc}`;
        guiDiv.append(nameDiv);

        for(const setting of module.settings) {
            const settingDiv = createDiv("settingDiv");
            // settingDiv.style["border-color" as any] = borderStr;
            // settingDiv.onmouseenter = () => {

            // }
            settingDiv.title = setting.desc;
            const settingName = createDiv("settingContent");
            settingName.textContent = `${setting.name} : ${setting.desc}`;

            settingDiv.appendChild(settingName);
            const settingElmHolder = createDiv("settingContent");
            if(setting.req){
                setting.req.otherSetting.on("change", (val) => {
                    if(val == setting.req?.toBeVal) {
                        settingDiv.style.display = "grid";
                    } else {
                        settingDiv.style.display = "none";
                    }
                });
            }
            if(setting instanceof BoolSetting) {
                const settingElm = createInput("checkbox", "settingContent");
                
                settingElm.checked = setting.val;

                settingElm.oninput = () => {
                    setting.set(settingElm.checked);
                    if(setting == module.enabled) {
                        if(setting.val) {
                            module.enable();
                        } else module.disable();
                    }
                }
                // const settingElmHolder = createDiv("settingContent");
                settingElmHolder.appendChild(settingElm);
                // settingDiv.appendChild(settingElmHolder);
            } else if(setting instanceof BindSetting) {
                const settingElm = createElement("button", "settingContent", "bindBtn");
                settingElm.textContent = getBindSettingStr(setting);

                settingElm.onmousedown = (e) => {
                    if(e.button == 2) {
                        if(GuiModule.bindingSetting == setting) {
                            GuiModule.bindingSetting = null;
                        }
                        setting.set("");
                        setting.save();
                        settingElm.textContent = getBindSettingStr(setting);
                    } else {
                        if(GuiModule.bindingSetting != setting) {
                            GuiModule.bindingSetting = setting;
                            GuiModule.bindingSettingElm = settingElm;
                            settingElm.textContent = "BIND: BINDING";
                        } else {
                            GuiModule.bindingSetting = null;
                            settingElm.textContent = getBindSettingStr(setting);
                        }
                    }
                }
                // const settingElmHolder = createDiv("settingContent");
                settingElmHolder.appendChild(settingElm);
                // settingDiv.appendChild(settingElmHolder);
            } else if (setting instanceof NumSetting) {
                const settingElm = createInput("range", "settingContent");
                settingElm.min = setting.minVal.toString();
                settingElm.max = setting.maxVal.toString();
                settingElm.value = setting.val.toString();
                settingName.textContent = `${setting.name} : ${settingElm.value} : ${setting.desc}`;

                settingElm.oninput = () => {
                    settingName.textContent = `${setting.name} : ${settingElm.value} : ${setting.desc}`;
                    setting.set(settingElm.value);
                }
                //settingElm.setAttribute("type", "range");
               // settingElm.setAttribute("min", setting.minVal + "");
               // settingElm.setAttribute("max", setting.maxVal + "");
            //    const settingElmHolder = createDiv("settingContent");
               settingElmHolder.appendChild(settingElm);
            //    settingDiv.appendChild(settingElmHolder);
            } else if(setting instanceof EnumSetting) {
                const settingElm = createElement("select");
                for(const i in setting.rawEnum) {
                    if(isNaN(parseInt(i))) continue;
                    const optionElm = createElement("option");
                    optionElm.value = i;
                    optionElm.text = setting.rawEnum[i];
                    settingElm.appendChild(optionElm);
                }

                settingElm.value = setting.val.toString();
                settingElm.oninput = () => {
                    setting.set(settingElm.value);
                }
                // const settingElmHolder = createDiv("settingContent");
                settingElmHolder.appendChild(settingElm);
                // settingDiv.appendChild(settingElmHolder);
            } else if(setting instanceof StringSetting) {
                const settingElm = createInput("text", "settingContent");
                settingElm.value = setting.val;
                var oldVal = setting.val;        
                settingElm.oninput = () => {
                    if(!setting.set(settingElm.value)) {
                        settingElm.value = oldVal;
                    } else {
                        oldVal = setting.val;
                    }
                }

                settingElmHolder.appendChild(settingElm);
            } else if(setting instanceof ColorSetting) {
                const settingElm = createInput("color", "settingContent");
                settingElm.value = setting.asStr();

                settingElm.oninput = () => {
                    setting.set(settingElm.value);
                }

                settingElmHolder.appendChild(settingElm);
            }

            
            settingDiv.appendChild(settingElmHolder);
            guiDiv.appendChild(settingDiv);
        }

        return guiDiv;
    }

    onPostInit(): void {
        function setExpanded(categoryDiv: HTMLDivElement, exp: boolean, cat: Category) {
            for(const child of Array.from(categoryDiv.children) as HTMLElement[]) {
                if(child.tagName == "DIV"){
                    child.style.display = exp ? "block" : "none";
                }
            }
            categoryDiv.setAttribute("expanded", exp.toString());
            if(!storageDat.curConfig.menuPos[cat]) {
                storageDat.curConfig.menuPos[cat] = {
                    left: 0,
                    top: 0,
                    category: cat,
                    expanded: true
                }
            }
            storageDat.curConfig.menuPos[cat].expanded = JSON.parse(categoryDiv.getAttribute("expanded")!);
            setStorage();
        }

        for(const module of moduleManager.modules) {
            if(categoryDivs.has(module.category)) continue;

            const categoryDiv = createDiv("catDiv");
            categoryDiv.append(Category[module.category]);

            const ind = storageDat.curConfig.menuPos[module.category];
            if(ind) {
                categoryDiv.style.top = ind.top + "px";
                categoryDiv.style.left = ind.left + "px";
            }


            
            categoryDiv.addEventListener("mousedown", (e) => {
                
                if(e.button == 2 && e.target == categoryDiv) {
                    setExpanded(categoryDiv, !JSON.parse(categoryDiv.getAttribute("expanded")!), module.category);
                }
            });
            
            

            categoryDivs.set(module.category, categoryDiv);
        }

        for(const module of moduleManager.modules) {
            const modDiv = createDiv("moduleDiv");
            modDiv.append(module.name);

            module.guiElement = modDiv;

           const catDiv = categoryDivs.get(module.category);
           if(!catDiv) continue;



           catDiv.appendChild(modDiv);

           modDiv.title = module.desc;

           modDiv.addEventListener("mousedown", (e) => {
               if(e.button == 0) {//left
                module.toggle();
               } else if(e.button == 2) {//right, and open gui
                if(modGui) {
                    modGui.remove();
                    modGui = null;
                    if(currentModGui == module.name) {
                        currentModGui = null;
                        return;
                    }
                }
                currentModGui = module.name;
                modGui = this.renderGui(module);
                moduleDiv.appendChild(modGui);
               }
           });

           makeDraggable(catDiv, module.category);
           setExpanded(catDiv, storageDat.curConfig.menuPos[module.category]?.expanded ?? true, module.category);
        }

        

        for(const catDiv of categoryDivs.values()) {
            guiHolder.appendChild(catDiv);
        }

        document.body.appendChild(guiHolder);
    }

    tryRender() {
        // if(!this.enabled || !this.particles) return;

        

        // requestAnimationFrame(this.tryRender);
    }
}