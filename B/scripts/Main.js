import { //MolangVariableMap,
    //BlockAreaSize,
    //ItemStack,
    world,
    Player,
    system
    //BlockTypes,
    //EntityTypes,
    //ItemTypes
  } from "@minecraft/server";
import * as mc from "@minecraft/server";
import lmd5 from "./md5.js"
import * as t from "./text.js"
import {btnBar , infoBar , arrayEditor} from "./ui.js"
import {ui_icon , usf_config , data_format , pictures} from "./data.js"

var config = {}
var dictionary = {}
var fixed_texts = {
    ZN : {},
    ZW : {}
}

//获取3个维度
const overworld = world.getDimension("minecraft:overworld")
const end = world.getDimension("minecraft:the_end")
const nether = world.getDimension("minecraft:nether")
const dimensions =[
    overworld,
    nether,
    end
]
const lock_rules = ["MobGriefing","KeepInventory","TntExplodes","ShowCoordinates","Pvp","DoMobSpawning","DoImmediateRespawn","CommandBlocksEnabled"]
//给予三个维度名字
overworld.name = get_text("overworld.name")
end.name = get_text("end.name")
nether.name = get_text("nether.name")

const version_code = "0.6.21B"
const version_text = `欢迎使用无名氏服务器框架\n插件版本:${version_code}\n作者：EarthDLL`

//命名空间
const namespace = "usfV2:"
const ui_path = "textures/ui/"

var has_owner = false
var reloaded = false
var last_id = Date.now()
var reset_boards = []
var cache = {
    time : 0,
}
var tran_info = {
    weather : "",
}
var lock_config = []
var ops = []
var item_count = 0
var id_names = {}
var lands = {
    min : [],
    max : [],
    ids : []
}
var logs = []
var log_config = {
    able : false,
    time : Date.now(),
    server : true
}
var ids = []
var groups = []
var group_mess = {}
var id_player = {}
var public_pos = []
var share_pos = []
var world_pos = []
var sign = {}
var chest = {}
var white_words = []
var log_info = {
    "bb":{

    },
    "pb":{

    }
}

//注册事件与任务
world.afterEvents.entityHurt.subscribe(afterEntityHurt)
world.afterEvents.itemUse.subscribe(afteritemUse)
world.afterEvents.entityDie.subscribe(afterEntityDie)
world.afterEvents.entityLoad.subscribe(afterEntityLoad)
world.beforeEvents.entityRemove.subscribe(beforeEntityRemove)
world.afterEvents.playerDimensionChange.subscribe(afterPlayerDimensionChange)
world.afterEvents.entityHitEntity.subscribe(afterEntityHitEntity)
world.afterEvents.entityHitBlock.subscribe(afterEntityHitBlock)
world.beforeEvents.explosion.subscribe(beforeExplosion)
//world.beforeEvents.blockExplode.subscribe(beforeExplosion)
world.beforeEvents.chatSend.subscribe(beforeChatSend)
world.afterEvents.playerGameModeChange.subscribe(afterPlayerGameModeChange)
world.beforeEvents.playerLeave.subscribe(beforePlayerLeave)
world.afterEvents.playerInteractWithBlock.subscribe(afterPlayerInteractWithBlock)
world.afterEvents.playerSpawn.subscribe(playerSpawn)
world.beforeEvents.playerInteractWithBlock.subscribe(beforePlayerInteractWithBlock)
world.beforeEvents.playerInteractWithEntity.subscribe(beforePlayerInteractWithEntity)
world.afterEvents.playerPlaceBlock.subscribe(afterBlockPlace)
world.beforeEvents.playerPlaceBlock.subscribe(beforeBlockPlace)
world.beforeEvents.itemUse.subscribe(beforeItemUse)
world.afterEvents.playerBreakBlock.subscribe(afterBlockBreak)
world.beforeEvents.playerBreakBlock.subscribe(beforeBlockBreak)
world.afterEvents.entitySpawn.subscribe(afterEntitySpawn)
world.afterEvents.worldInitialize.subscribe(worldInitializeEvent)
system.afterEvents.scriptEventReceive.subscribe(scriptEventReceive,{"namespaces":["usf"]})
world.afterEvents.weatherChange.subscribe(afterWeatherChanged)
world.afterEvents.pistonActivate.subscribe(afterPistonActivate)
world.afterEvents.gameRuleChange.subscribe(afterGameRuleChange)

import("@minecraft/server-net").then((http)=>{
    push_text("log.enable","当前日志功能可用！请开启日志服务器！")
    log(get_text("log.enable"),[],"tip",1)
    log_config.able = true
    system.runInterval(()=>{
        if(!log_config.server){
            if(Date.now() - log_config.time > config.log.down*1000){
                log_config.server = true
            }else{
                return
            }
        }
        for(var op of logs){
            var re  = new http.HttpRequest(config.log.address)
            re = re.addHeader("usf",to_json(op))
            re.timeout = 10
            re.method = "Get"
            http.http.request(re).then((r)=>{
                if(r.body !== "usf"){
                    log_config.server = false
                    log_config.time = Date.now()
                }
            }).catch((err)=>{})
        }
        logs = []
    },10)
}).catch((err)=>{})

//tran_text的全局内容更新(每2s)
var system_ids = {}
system_ids.tran = system.runInterval(()=>{
    try{
    tran_info.unsleep = ""
    tran_info.list = ""
    for(var n of world.getAllPlayers()){
        tran_info.list += n.name + ","
        if(!n.isSleeping){
            tran_info.unsleep += n.name + ","
        }
    }
    tran_info.list = tran_info.list.slice(0,tran_info.list.length -1)
    tran_info.unsleep = tran_info.unsleep.slice(0,tran_info.unsleep.length -1)
    tran_info.alltime = `${Math.round(system.currentTick/20)}s`
    tran_info.worldspawn = pos_string(world.getDefaultSpawnLocation())
    tran_info.count = String(world.getAllPlayers().length)
    tran_info.items = String(item_count)
    
    var d = new Date()
    tran_info.date = `${d.getFullYear()}.${d.getMonth()}.${d.getDate()}`
    tran_info.time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
    
    try{
        for(var b of reset_boards){
            var board = world.scoreboard.getObjective(b[0])
            if(!un(board)){
                for(var p of world.getAllPlayers()){
                    if(!un(p.scoreboardIdentity)){
                        var score = undefined
                        try{
                            score = board.getScore(p)
                        }catch(err){}
                        if(un(score)){
                            try{
                                board.setScore(p,b[1])
                            }catch(err){}
                        }
                    }
                }
            }
        }
    }catch(err){}
    }catch(err){}
},40)

system_ids.board = system.runInterval(()=>{
    if(config.copy_boards !== ""){
        for(var id of config.copy_boards.split(";")){
            var ob = world.scoreboard.getObjective(id)
            if(!un(ob)){
                var ob_show = world.scoreboard.getObjective(id+"_")
                if(un(ob_show)){
                    ob_show = world.scoreboard.addObjective(id+"_",ob.displayName)
                }
                overworld.runCommand(`scoreboard players reset * ${id}_`)
                for(var p of world.getAllPlayers()){
                    if(ob.hasParticipant(p)){
                        ob_show.setScore(p,ob.getScore(p))
                    }
                }
            }
        }
    }
},10)

system_ids.lock = system.runInterval(()=>{
    if(!config.game.lock){
        return
    }
},10)

system_ids.particle = system.runInterval(()=>{
    for(var p of world.getAllPlayers()){
        if(p.landing.mode === 1){
            setActionBar(p,get_text("action.land"))
            if(is_array(p.landing.points)){
                if(p.landing.points.length === 2){
                    show_range(p.landing.points[0].location,p.landing.points[1].location,p.dimension)
                }
            }
        }
    }
},35)

system_ids.lo = system.runInterval(()=>{
    if(config.log.able && array_has(config.log.allow,"lo")){
        for(var p of world.getAllPlayers()){
            server_log(0,`Location:${get_block_pos_di(p)}`,get_player_path(p))
        }
    }
},20*60)

system_ids.tag = system.runInterval(()=>{
    for(var p of world.getAllPlayers()){
        for(var tag of p.getTags()){
            if(tag.startsWith("usf.") && tag.indexOf(":") !== -1){
                var type = tag.slice(4)
                var text = type.slice(type.indexOf(":")+1)
                type = type.slice(0,type.indexOf(":"))
                switch(type){
                    case "tag":
                        set_chat_tag(p,(text === "Reset") ? "" : text)
                        break

                }

                p.removeTag(tag)
            }
        }
    }
},5*20)


var follow_index = 0
system_ids.follow = system.runInterval(()=>{
    for(var p of world.getAllPlayers()){
        if(is_object(p.follow)){
            if(!p.follow.player.isValid()){
                reset_player_follow(p)
                return
            }
            p.addEffect("night_vision",6)
            switch(p.follow.type){
                case 0:
                    var lo = p.follow.player.getHeadLocation()
                    var view = p.follow.player.getViewDirection()

                    lo.x = lo.x - view.x*3
                    lo.y = lo.y + 4
                    lo.z = lo.z - view.z*3
                    if(follow_index%15 === 0){
                        follow_index = 0
                        tp_entity(p,p.follow.player.dimension,lo.x,-10000,lo.z)
                    }
                    p.camera.setCamera("usf:example_player_effects",{
                        location : lo,
                        facingEntity : p.follow.player,
                        easeOptions :{
                            easeTime : 0.2
                        }
                    })
                    break
                case 1:
                    var lo = {
                        x : p.location.x,
                        z : p.location.z,
                        y : p.location.y - (-10000)
                    }
                    if(follow_index%15 === 0 && p.dimension.id !== p.follow.player.dimension.id){
                        follow_index = 0
                        lo = p.follow.player.location
                        tp_entity(p,p.follow.player.dimension,lo.x,-10000 + lo.y,lo.z)
                    }
                    p.camera.setCamera("usf:example_player_effects",{
                        location : lo,
                        rotation : p.getRotation(),
                        easeOptions :{
                            easeTime : 0.2
                        }
                    })
            }
        }
    }
    follow_index += 1
    
},4)

system_ids.second = system.runInterval(()=>{
    for(var player of world.getAllPlayers()){
        player.block_places = 0
    }
    
    if(config.other.online !== ""){
        var ids = config.other.online.split(";")
        array_clear(ids,"")
        for(var id of ids){
            try{
                var ob = world.scoreboard.getObjective(id)
                if(!un(ob)){
                    if(un(world.scoreboard.getObjective(id+"_"))){
                        world.scoreboard.addObjective(id+"_",ob.displayName)
                    }
                    
                    var nob = world.scoreboard.getObjective(id + "_")
                    overworld.runCommand(`scoreboard players reset * "${id + "_"}"`)
                    for(var p of ob.getParticipants()){
                        try{
                        if(!un(p.getEntity())){
                            nob.setScore(p,ob.getScore(p))
                        }}catch(err){}
                    }
                }
            }catch(err){console.error(err)}
        }
    }
    
    var op = {
        type : "bat",
        tags : ["Float"]
    }
    for(var di of dimensions){
        for(var bat of di.getEntities(op)){
            bat.nameTag = tran_text(null,get_data("text",bat))
            var lo = to_object(parse_json(get_data("lo",bat)))
            if(is_string(lo.di)){
                tp_entity(bat,get_di(lo.di),lo.x,lo.y,lo.z)
            }
        }
    }
},20)

system_ids.land_test = system.runInterval(()=>{
    for(var player of world.getAllPlayers()){
        var land = get_land_by_pos(player.dimension,player.location)
        
        if(is_string(land.name)){
            if(player.in_land !== land.id){
                server_log(0,'In Land :'+String(land.name)+`(${get_name_by_id(land.creater)})`,get_player_path(player))
            }
            player.in_land = land.id
            var text = ""
            
            var item = player.slots.getItem(player.selectedSlotIndex)
            if(un(item)){item = ""}
            else{item = item.typeId}
            if(array_has(config.cd_items,item)){
                text = `§e领地名称:${land.name}\n领地主:${get_name_by_id(land.creater)}\n领地ID:${land.id}`
            }
            else{
                switch(land_member_level(player,land)){
                    case 4:
                        text += get_text("land.4")
                        break
                    case 3:
                        text += get_text("land.3")
                        break
                    case 2:
                        text += get_text("land.2")
                        break
                    case 1:
                        text += get_text("land.1")
                        break
                    case 0:
                        text += get_text("land.0")
                        break
                }
                text += config.land.show.replaceAll("/name",get_name_by_id(land.creater)) 
                if(land.wel !== ""){
                    text += "\n§r" + land.wel
                }
            }
            if(Date.now() - to_number(player.last_warn,0) > 1500){
                setActionBar(player,text)
            }
        }else{
            if(player.in_land !== ""){
                player.in_land = ""
                setActionBar(player,` `)
            }
        }
    }
},3)

system_ids.name = system.runInterval(()=>{
    for(var p of world.getAllPlayers()){
        change_player_name(p)
    }
},100)

system_ids.test = system.runInterval(()=>{
    for(var player of world.getAllPlayers()){
        
        }
          
    
},10)

system_ids.chest_log = system.runInterval(()=>{
    for(var pos of Object.keys(sign)){
        var block = sign[pos].block
        var record = false
        if(block.isValid()){
            if(block.typeId === sign[pos].id){
                var entities = {}
                try{
                    entities = block.dimension.getEntities({
                        location : block.location,
                        maxDistance : 6,
                        type : "player"
                    })
                }catch(err){}
                if((is_array(entities) && entities.length === 0) || !is_array(entities)){
                    record = true
                }

                var com = block.getComponent("minecraft:sign")
                sign[pos].now = [com.getText("Front"),com.getText("Back")]
            }
        }else{
            record = true
        }

        if(record){
            for(var i=0;i<sign[pos].now.length;i++){
                if(sign[pos].before[i] !== sign[pos].now[i]){
                    server_log(0,`Sign Change${pos}:\nFrom:${sign[pos].before[i]}\nTo:${sign[pos].now[i]}`,"Sign")
                }
            }
            delete sign[pos]
        }
    }

    for(var pos of Object.keys(chest)){
        var block = chest[pos].block
        var none = false
        if(block.isValid()){
            if(block.typeId !== chest[pos].typeId){
                none = true
            }else{
                var entities = {}
                try{
                    entities = block.dimension.getEntities({
                        location : block.location,
                        maxDistance : 6,
                        type : "player"
                    })
                }catch(err){}
                if((is_array(entities) && entities.length === 0) || !is_array(entities)){
                    var items = chest[pos].items
                    var new_items = {}
                    var com = block.getComponent("minecraft:inventory").container
                    for(var i=0;i<com.size;i++){
                        var item = com.getItem(i)
                        if(!un(item)){
                            new_items[no_minecraft(item.typeId)] = to_number(new_items[no_minecraft(item.typeId)]) + item.amount
                        }
                    }
                    var text = `${no_minecraft(block.typeId)}${pos} Close:\nPlayers:`
                    for(var name of chest[pos].players){
                        text += name + ","
                    }
                    text += "\nChanges:"
                    var keys = Object.keys(items)
                    for(var k of Object.keys(new_items)){
                        if(!array_has(keys,k)){
                            keys.push(k)
                        }
                    }
                    for(var k of keys){
                        text += `${k}(${to_number(new_items[k]) - to_number(items[k])});`
                    }
                    server_log(0,text,"Chest")
                    delete chest[pos]
                }
            }
        }else{
            none = true
        }
        if(none){
            var text = `${no_minecraft("block.typeId")}${pos} Close : No Data\nPlayers:`
            for(var name of chest[pos].players){
                text += name + ","
            }
            server_log(0,text,"Chest")
            delete chest[pos]
        }
    }
    
},1*20)

system_ids.long_log = system.runInterval(()=>{
    if(config.log.able === false || log_config.able === false){
        log_info = {
            bb :{},
            pb : {}
        }
        return
    }
    for(var name of Object.keys(log_info.bb)){
        for(var id of Object.keys(log_info.bb[name])){
            var block = log_info.bb[name][id]
            var text = "Break " + id + "*" + String(block.length)
            for(var pos of block){
                text += pos
            }
            server_log(0,text,get_player_path({name:name}))
        }
    }
    for(var name of Object.keys(log_info.pb)){
        for(var id of Object.keys(log_info.pb[name])){
            var block = log_info.pb[name][id]
            var text = "Place " + id + "*" + String(block.length)
            for(var pos of block){
                text += pos
            }
            server_log(0,text,get_player_path({name:name}))
        }
    }
    log_info = {
        bb :{},
        pb : {}
    }
    
},30*20)



system.group_mess = system.runInterval(()=>{
    for(var g_id of Object.keys(group_mess)){
        var g = get_group(g_id)
        if(is_group(g)){
            g.message = g.message.concat(group_mess[g_id])
            if(g.message.length > 50){
                g.message = g.message.slice(0,50)
            }
            save_group(g)
        }
    }
    group_mess = {}
},20*30)

system_ids.time = system.runInterval(()=>{
    if(config.time.able){
        if(un(world.scoreboard.getObjective("time_show"))){
            if(config.time.type === 0){
                world.scoreboard.addObjective("time_show","游戏时间/秒")
            }else{
                world.scoreboard.addObjective("time_show","游戏时间/分钟")
            }
        }
        if(un(world.scoreboard.getObjective("time"))){
            world.scoreboard.addObjective("time","时间")
        }

        var time = world.scoreboard.getObjective("time")
        var time_show = world.scoreboard.getObjective("time_show")

        switch(config.time.type){
            case 0:
                for(var p of world.getAllPlayers()){
                    if(!un(p.scoreboardIdentity)){
                        time.addScore(p,1)
                    }
                }
                break
            case 1:
                cache.time += 1
                if(cache.time %60 === 0){
                    for(var p of world.getAllPlayers()){
                        if(!un(p.scoreboardIdentity)){
                            time.addScore(p,1)
                        }
                    }
                }
                break
        }

        if(config.time.show){
            world.scoreboard.setObjectiveAtDisplaySlot("List",{
                objective : time_show,
            })
            for(var p of time_show.getParticipants()){
                time_show.removeParticipant(p)
            }
            for(var p of world.getAllPlayers()){
                if(!un(p.scoreboardIdentity)){
                    time_show.setScore(p,to_number(time.getScore(p),0))
                }
            }
        }
    }
},20)

function afterGameRuleChange(event){
    chat("0")
    if(config.rule.able){
        var rules = to_object(parse_json(config.rule.data))
        chat(event.rule)
        if(!un(rules[event.rule])){
            
            if(rules[event.rule] !== event.value){
                switch(event.rule){
                    case "commandBlocksEnabled":
                        world.gameRules.commandBlocksEnabled = rules[event.rule]
                        break
                    case "doImmediateRespawn":
                        world.gameRules.doImmediateRespawn = rules[event.rule]
                        break
                    case "keepInventory":
                        world.gameRules.keepInventory = rules[event.rule]
                        break
                    case "mobGriefing":
                        world.gameRules.mobGriefing = rules[event.rule]
                        break
                    case "pvp":
                        world.gameRules.pvp = rules[event.rule]
                        break
                    case "showCoordinates":
                        world.gameRules.showCoordinates = rules[event.rule]
                        break
                    case "tntExplodes":
                        world.gameRules.tntExplodes = rules[event.rule]
                        break
                    case "doMobSpawning":
                        world.gameRules.doMobSpawning = rules[event.rule]
                        break
                }
            }
        }
    }
}

function push_text( id , text1 , text2 ){
    fixed_texts.ZN[id] = text1
    if(is_string(text2)){
        fixed_texts.ZW[id] = text2
    }
    
    return id
}

function get_di(id){
    return world.getDimension(id)
}

function log( text , replacer = [] , hint = "" , mode = 0 ){
    // mode 0-管理员屏幕 1-控制台 2-管理员+控制台
    text = to_string(text)
    text = format(text,replacer)
    switch(hint){
        case "tip":
            hint = "§6[提示]§r"
            break
        case "info":
            hint = "§f[信息]§r"
            break
        case "error":
            hint = "§c[错误]§r"
            break
        case "warn":
            hint = "§e[警告]§r"
            break
        case "lead":
            hint = "§7[指引]§r"
            break
    }
    text = "§3[USFLog]§r" + hint + text
    if(mode !== 1){
        var t = []
        for(var p of world.getAllPlayers()){
            if(get_op_level(p)>0){
                t.push(p)
            }
        }
        chat(text,t,false)
    }
    if(mode !== 0){
        console.warn(clear_colour(text))
    }
}

function get_ban_list(){
    return to_array(parse_json(get_data("ban")),[])
}


function score_event(player , id){
    if(config.score.able == false || un(player.scoreboardIdentity) || !array_has(config.scores,id)){
        return
    }
    var board = world.scoreboard.getObjective(config.score.id)
    if(!is_object(board)){
        world.scoreboard.addObjective(config.score.id,"积分")
        board = world.scoreboard.getObjective(config.score.id)
    }

    var c = get_score_config()[id]
    if(is_array(c)){
        var current = to_number(player.info.score[id],0)
        if(c[1] > current){
            player.info.score[id] = current + c[0]
            board.addScore(player,c[0])
            save_player_info(player)
        }
    }
}

function get_items(id){
    var all = []
    try{
        var items = overworld.runCommand(`strcuture load items.${id} 0 -64 0`)
    }catch(err){
        return []
    }
    if(items.successCount === 1 && !un(chest_block)){
        var com = chest_block.getComponent("minecraft:inventory").container
        for(var i =0 ;i<com.size;i++){
            all.push(com.getItem(i))
        }
        return all
    }
    return []

}



function kick(player , reason = "" , force = false){
    if(force === false && get_op_level(player)>0){
        return
    }
    overworld.runCommand(`kick "${player.name}" ${reason}`)
}

function get_player_path(player){
    return `Players/${player.name}`
}

function chat(mess,targets = null,tran = true){
    if(is_array(targets)){
        for(var p of targets){
            var new_mess = mess
            if(tran){
                new_mess = tran_text(p,new_mess)
            }
            p.sendMessage(new_mess)
        }
    }else{
        for(var p of world.getAllPlayers()){
            var new_mess = mess
            if(tran){
                new_mess = tran_text(p,new_mess)
            }
            p.sendMessage(new_mess)
        }
    }
}


function get_owners(){
    var os = parse_json(get_data("owners"))
    os = to_array(os,[])
    if(os.length === 0){
        has_owner = false
    }else{ has_owner = true}
    return os
}

function player_add_group(player , id){
    var group_ids = to_array(parse_json(get_data("groups",player)),[])
    group_ids.push(id)
    save_data("groups",to_json(group_ids),player)
}

function is_owner(player){
    var id = ""
    if(is_object(player)){
        id = get_id(player)
    }else{
        id = player
    }
    if(get_owners().indexOf(id) !== -1){
        return true
    }
    return false
}

function get_text(id){
    var text = dictionary[id]
    if(config.language === 1){
        text = fixed_texts.ZW[id]
    }
    if(text == undefined){
        text = fixed_texts.ZN[id]
    }
    if(text == undefined){
        return t.get_text(id,to_number(config.language),0)
    }
    return text
}

function get_land(id){
    var data = get_data(`land.${id}`)
    if(data === ""){
        return {}
    }else{
        return parse_json(data)
    }
}

function save_player_lands(player){
    save_data("lands",to_json(player.lands),player)
}


function is_between(count , c1 , c2){
    if(count >= c1 && count <= c2){
            return true
    }
    if(count === c1 && count === c2){
        return true
    }
    if(count <= c1 && count >= c2){
        return true
    }
    return false
}

function get_safe_area(lo,l){
    var area = [Math.max(l.from[0] - lo.x,l.to[0] - lo.x),Math.max(l.from[1] - lo.z,l.to[1] - lo.z)]
    return area
}

function int_location(loc){
    var lo = {...loc}
    lo.x = Math.floor(lo.x)
    lo.z = Math.floor(lo.z)
    return lo
}



function get_op_level(player){
    if(is_owner(player)){return 2}
    if(is_op(player)){return 1}
    return 0
}

function is_op(player){
    var id = ""
    if(is_object(player)){
        id = get_id(player)
    }else{
        id = player
    }
    if(ops.indexOf(id) !== -1){
        return true
    }
    return false
}

function tp_entity(entity,di,x,y,z,show = false,keep = false,back = false){
    system.run(()=>{
    if(show && is_player(entity)){
        show_title(entity,"正在传送...")
    }
    if(back){
        entity.back_pos = [entity.dimension,entity.location.x,entity.location.y,entity.location.z]
    }
    entity.teleport({"x":x,"y":y,"z":z},{dimension:di,keepVelocity:keep})
    })
    if(array_has(config.log.allow,"tp") &&is_player(entity)){
        server_log(0,`TP:${get_block_pos_di({dimension:di,location:{x:x,y:y,z:z}})}`,get_player_path(entity))
    }
}

function no_minecraft(text){
    return text.replaceAll("minecraft:","mc:")
}

function show_title(player,text){
    try{
    player.onScreenDisplay.setTitle(tran_text(player,text))
    }catch(err){}
}

function is_player(player){
    if(!is_object(player) || player == null){
        return
    }
    return player.typeId === "minecraft:player" ? true : false
}

function save_player_info(player){
    save_data("info",to_json(player.info),player)
}

function get_string_length(str,charset){
    var total = 0,
        charCode,
        i
    charset = charset ? charset.toLowerCase() : '';
    for(var i = 0;i <  str.length; i++){
        charCode = str.charCodeAt(i);
        if(charCode <= 0x007f) {
            total += 1;
        }else if(charCode <= 0x07ff){
            total += 2;
        }else if(charCode <= 0xffff){
            total += 3;
        }else{
            total += 4;
        }
    }
    return total;
}

function get_name_by_id(id){
    if(!un(id_names[id])){
        return id_names[id]
    }
    return "离线玩家"
}

function object_override(object,format){
    for(var cf of Object.keys(format)){
        if(un(object[cf])){
            if(is_object(format[cf])){
                if(is_array(format[cf])){
                    object[cf] = [...format[cf]]
                }else{
                    if(format[cf] == null){
                        object[cf] = null
                    }else{
                        object[cf] = {}
                        object_override(object[cf],format[cf])
                    }
                }
            }else{
                object[cf] = format[cf]
            }
            
        }
        if(is_object(object[cf]) && !is_array(object[cf]) && format[cf] != null){
            object_override(object[cf], format[cf])
        }
    }
}

function load_config(){
    config = to_object(parse_json(get_data("config")),{})
    object_override(config , usf_config)
}

function save_config(){
    save_data("config",to_json(config))
}

function get_board_ids(){
    return to_array(parse_json(get_data("board_ids")),[])
}

function get_boards(){
    var boards = {}
    var ids = get_board_ids()
    for(var id of ids){
        var data = get_data(id)
        if(data !== ""){
            boards[id] = to_object(parse_json(data))
        }
    }
    return boards
}

function is_group(v){
    if(Object.keys(v).length > 0){
        return true
    }
    return false
}

function get_group(id){
    return to_object(parse_json(get_data("group"+id)),{})
}

function save_group(g){
    save_data("group"+g.id , to_json(g))
    if(!array_has(groups,g.id)){
        groups.push(g.id)
        save_groups()
    }
}

function save_groups(){
    save_data("group_ids",to_json(groups))
}

function get_random_group_id(){
    var id = random_int(899999) + 100000
    while(is_group(get_group(id))){
        id = random_int(899999) + 100000
    }
    return id
}
function get_random_land_id(){
    var id = random_int(899999) + 100000
    while(array_has(lands.ids,id)){
        id = random_int(899999) + 100000
    }
    return id
}

function get_player_groups(player){
    var group_ids = to_array(parse_json(get_data("groups",player)),[])
    var my_groups = []
    for(var id of group_ids){
        var g = parse_json(get_data("group"+id))
        if(is_group(g)){
            if(g.creater === get_id(player) || array_has(g.member,get_id(player))){
                my_groups.push(g)
            }
        }
    }

    group_ids = []
    for(var g of my_groups){
        group_ids.push(g.id)
    }
    save_data("groups",to_json(group_ids),player)

    return my_groups
}

function get_score_config(){
    return to_object(parse_json(get_data("score_config")),{})
}





function reload_all(){
    if(Date.now() - parse_number(get_data("reset")) <= 30000){
        save_data("owners","")
        log("最高管理员已被重置!",[],"warn",2)
    }

    if(un(world.scoreboard.getObjective("usf_data"))){
        world.scoreboard.addObjective("usf_data","USF数据")
    }
    
    dictionary = to_object(parse_json(get_data("dictionary")),{})
     
    groups = to_array(parse_json(get_data("group_ids")),[])
    var score_config = get_score_config()
    object_override(score_config,data_format.score)
    save_data("score_config",to_json(score_config))

    public_pos = get_public_pos()
    world_pos = to_array(parse_json(get_data("world_pos")),[])

    lock_config = to_array(parse_json(get_data("lock_items")))

    get_owners()

    reset_boards = to_array(parse_json(get_data("reset_boards")),[])

    lands.min = to_array(parse_json(get_data("lands_min")),[])
    lands.max = to_array(parse_json(get_data("lands_max")),[])
    lands.ids = to_array(parse_json(get_data("lands_ids")),[])

    config = parse_json(get_data("config"))
    object_override(config,usf_config)
    
    ids = to_array(parse_json(get_data("ids")),[])
    id_names = to_object(parse_json(get_data("id_names")),{})
    ops = to_array(parse_json(get_data("op")),[])
    
    white_words = to_array(parse_json(get_data("white_words")),[])
}

function save_reset_boards(){
    save_data("reset_boards",to_json(reset_boards))
}

function save_lock_config(){
    save_data("lock_items",to_json(lock_config))
}

function setActionBar(player,text,tran = false){
    var content = text
    if(tran){
        content = tran_text(player,content)
    }
    try{
        player.onScreenDisplay.setActionBar(content)
    }catch(eer){
        player.runCommandAsync(`titleraw @s actionbar {\"rawtext\": [{"text":"${content}"}]}`)
    }
}

function clear_data(id){
    world.setDynamicProperty(namespace+id)
}

function save_data(id , content , en = null){
    if(en === null){
        world.setDynamicProperty(namespace+id,content)
    }else{
        en.setDynamicProperty(namespace+id,content)
    }
}
function get_data(id , en = null){
    var data = ""
    if(en === null){
        data = world.getDynamicProperty(namespace+id)
    }else{
        data = en.getDynamicProperty(namespace+id)
    }
    
    if(is_string(data)){
        return data
    }
    return ""
}

function get_id(player){
    if(!is_string(player.usf_id)){
        var id = get_data("id",player)
        if(id === ""){
            if(Date.now() !== last_id){
                id = String(last_id)
                save_data("id",id,player)
                last_id ++
            }
        }
        player.usf_id = id
    }
    return player.usf_id
}
function get_block_pos(block){
    return `(${String(Math.round(block.location.x))},${String(Math.round(block.location.y))},${String(Math.round(block.location.z))})`
}

function get_block_pos_di(block){
    var text = "0:"
    if(block.dimension.id === "minecraft:nether"){
        text = "1:"
    }
    if(block.dimension.id === "minecraft:the_end"){
        text = "2:"
    }
    return `(${text}${String(Math.round(block.location.x))},${String(Math.round(block.location.y))},${String(Math.round(block.location.z))})`
}

function get_di_num(di){
    var text = "0"
    if(di.id === "minecraft:nether"){
        text = "1"
    }
    if(di.id === "minecraft:the_end"){
        text = "2"
    }
    return text
}

function get_player_by_id(id){
    if(un(id_player[id])){
        return null
    }
    return id_player[id]
}

function change_player_name(player){
    player.nameTag = tran_text(player,config.name.format)
}

function reset_player_data(player){

    get_id(player)
    
    if(array_has(get_ban_list(),String(get_id(player))) || array_has(get_ban_list(),player.name)){
        kick(player,"你已被封禁！")
    }

    player.info = parse_json(get_data("info",player))
    player.slots = player.getComponent("minecraft:inventory").container
    player.lands = []
    player.store_record = to_object(get_data("store_record",player))
    player.health = player.getComponent("minecraft:health")
    for(var id of to_array(parse_json(get_data("lands",player)))){
        if(array_has(lands.ids,id)){
            player.lands.push(id)
        }
    }
    save_player_lands(player)

    player.last_tp = 0
    player.landing = {
        points : [],
        mode : 0 ,
    }
    player.pos = get_player_pos(player)
    
    player.talk = {
        mode : 0,
        id : ""
    }
    id_player[get_id(player)] = player
    if(config.tip.able){
        chat(get_data("tip"),[player],true)
    }

    change_player_name(player)
    return
}

function get_chat_tag(player){
    var data = get_data("chat_tag",player)
    if(data === ""){
        if(config.chat.tag === ""){
            return player.dimension.name
        }else{
            return config.chat.tag
        }
    }
    return data + "§r"
}

function set_chat_tag(p,tag){
    save_data("chat_tag",tag,p)
}

function get_player_personal_pos(player){
    return to_array(parse_json(get_data("pos",player)),[])
}

function get_public_pos(){
    return to_array(parse_json(get_data("public_pos")),[])
}

function save_public_pos(){

    var new_pos = []
    for(var p of public_pos){
        if(is_string(p.name)){
            new_pos.push(p)
        }
    }
    save_data("public_pos",to_json(new_pos))
    public_pos = new_pos
}

function save_world_pos(){

    for(var p of world_pos){
        if(!is_string(p.name)){
            world_pos.splice(world_pos.indexOf(p),1)
        }
    }
    save_data("world_pos",to_json(world_pos))
}

function get_mode(player){
    switch(player.getGameMode()){
        case "creative":
            return 1
            break
        case "adventure":
            return 2
            break
        case "spectator":
            return 3
            break
    }
    return 0
}

function set_mode(player,mode){
    switch(mode){
        case 0:
            player.setGameMode("survival")
            break
        case 1:
            player.setGameMode("creative")
            break
        case 2:
            player.setGameMode("adventure")
            break
        case 3:
            player.setGameMode("spectator")
            break
    }
}

//事件

function get_chat_players(){
    var ps = []
    for(var p of world.getAllPlayers()){
        if(p.info.block === false){
            ps.push(p)
        }
    }
    return ps
}

function afterEntityDie(event){
    var entity = event.deadEntity
    var source = event.damageSource
    var cause = source.cause
    var hurt_entity = source.damagingEntity
    
    if(entity.typeId === "minecraft:bat" && entity.hasTag("Float")){
        var bat = entity.dimension.spawnEntity("minecraft:bat<usf:text>",entity.location)
        save_data("lo",get_data("lo",entity),bat)
        save_data("name",get_data("name",entity),bat)
        save_data("text",get_data("text",entity),bat)
        if(!bat.hasTag("Float")){
            bat.addTag("Float")
        }
    }

    if(is_player(entity)){
        var text = "Killed " + get_block_pos_di(entity)
        entity.last_die = {
            x:entity.location.x,
            y:entity.location.y,
            z:entity.location.z,
            di : entity.dimension
        }
        if(!un(hurt_entity)){
            if(is_player(hurt_entity)){
                text += " By " + hurt_entity.name
                score_event(hurt_entity,"pvp")
            }
        }
        text += `(Cause:${cause})`
        if(array_has(config.log.allow,"die")){
            server_log(0,text,get_player_path(entity))
        }
    }
    if(!un(hurt_entity)){
        if(is_player(hurt_entity)){
            if(array_has(config.log.allow,"kill")){
                var text = `Kill `
                if(is_player(entity)){
                    text += entity.name
                }else{
                    text += no_minecraft(entity.typeId)
                }
                text += get_block_pos_di(hurt_entity)
                server_log(0,text,get_player_path(hurt_entity))
            }
            if(entity.matches({families:["monster"]})){
                score_event(hurt_entity,"kill")
            }
        }
    }
}

function beforeExplosion(event){
    var entity = event.source
    var blocks = event.getImpactedBlocks()
    if(config.land.able){
        blocks = []
        for(var b of event.getImpactedBlocks()){
            var l = get_land_by_pos(b.dimension,b.center())
            if(!is_string(l.name)){
                blocks.push(b)
            }
        }
    }
    if(!un(entity)){
        if(config.game.creeper){
             if(entity.typeId === "minecraft:creeper"){
                blocks = []
            }
        }
    }
    event.setImpactedBlocks(blocks)
}

function reset_lock_item(player){
    try{
    for(var i =0;i<player.slots.size;i++){
        var item = player.slots.getItem(i)
        if(!un(item)){
            var lore = item.getLore()
            if(lore.length === 1){
                if(lore[0] === "usf:Lock"){
                    player.slots.setItem(i)
                }
            }
        }
    }

    for(var items of lock_config){
        try{
        var item = player.slots.getItem(items[0])
        if(un(item)){
            item = new mc.ItemStack(items[1],items[2])
            item.setLore(["usf:Lock"])
            item.lockMode = "slot"
            player.slots.setItem(items[0],item)
        }
        }catch(err){}
    }
    }catch(err){}
}

function run_command(player,com){
    com = com.slice(1) + " "
    var commands = []
    var is_in = false
    //如果为true，则正在引号内
    var last_char = 0
    for(var i=0 ; i<com.length; i++){
        var c = com.charAt(i)
        if(c === "\""){
            is_in = is_in ? false : true
        }
        if(c === " " && !is_in){
            var part = com.slice(last_char,i).replaceAll("\"","")
            commands.push(part)
            last_char = i+1
        }
    }
    
    if(commands.length <1){
        return
    }
    
    if(!array_has(config.commands,commands[0]) && commands[0] !== "usf"){
        return
    }

    switch(commands[0]){
        case "land" : 
            if(player.landing.points.length === 2){
                createLandBar(player)
            }else{
                show_title(player,get_text("land.two"))
            }
            break
        case "unsleep":
            chat(get_text("unsleep")+`${tran_info.unsleep}`,[player])
            break
        case "home":
            var poss = []
            for(var pos of player.pos){
                if(pos.home){
                    poss.push(pos)
                }
            }
            if(poss.length === 0){
                chat(get_text("home.none"),[player])
                return
            }
            if(poss.length === 1){
                to_pos(player,poss[0])
                chat(get_text("home.back"),[player])
            }
            else{
                var ui = new btnBar()
                ui.title = get_text("home.select")
                ui.body = get_text("home.select2")
                ui.busy = null
                for(var pos of poss){
                    ui.btns.push({
                        text : `[${get_di(pos.di).name}]${pos.name}`,
                        icon : pictures[pos.icon],
                        op : {
                            "pos" : pos
                        },
                        func : (op)=>{
                            to_pos(player,op.pos)
                            chat(get_text("home.back"),[player])
                        }
                    })
                }
                ui.show(player)
            }
            break
        case "cd":
            cdBar(player)
            break
        case "die":
            player.kill()
            break
        case "back":
            var die = player.last_die
            if(!un(die)){
                tp_entity(player,die.di,die.x,die.y,die.z,true)
            }
            break
        case "usf":
            chat(version_text,[player])
            break
        case "op":
            opBar(player)
            break
        case "tpr":
            var now = Date.now()
            if((config.tp.random_range > 0 && now - player.last_tp > config.tp.down*1000) && (player.dimension.id !== "minecraft:the_end" || config.tp.random_end === true)){
                random_tp(player,)
            }
            else{
                chat("§e[传送系统]当前无法进行传送！")
            }
            break
        case "tpaccept":
            if(!un(player.tpa)){
                if(Date.now() < player.tpa.time && player.tpa.goal.isValid()){
                    var goal = player.tpa.goal
                    if(player.tpa.mode === 1 ){
                        tp_entity(player,goal.dimension,goal.location.x,goal.location.y,goal.location.z,true,false,true)
                    }else{
                        tp_entity(goal,player.dimension,player.location.x,player.location.y,player.location.z,true,false,true)
                    }
                }
            }else{
                chat(get_text("tp.fail"),[player])
            }
            break
    }
}

function afterEntityHitBlock(event){
    var block = event.hitBlock
    var player = event.damagingEntity
    if(is_player(player)){
        
    }
}



function afterEntityHitEntity(event){
    var hitter = event.damagingEntity
   
}

function chatBoardBar(player,block,creater){
    if(!config.other.chat_board){
        chat(get_text("board.diable"),[player])
    }

    var com = block.getComponent("minecraft:inventory").container
    var item = com.getItem(0)
    var content = to_array(parse_json(get_data("content",item)))
    var ui = new btnBar()
    ui.body = content
    ui.title = get_text("board")
    ui.btns = [{
        text : get_text("board.go"),
        icon : ui_icon.edit,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.title = get_text("board.new")
            ui2.input("text",get_text("board.content"),get_text("input"),"")
            ui2.cancel = ()=>{
                chatBoardBar(player,block,creater)
            }
            ui2.show(player,(r)=>{
                var text = config.chat.format
                text = tran_text(player,text)
                text = text.replaceAll("/sender" , player.name)
                text = text.replaceAll("/text" , r.text)
                content.push(text)
                if(content.length > 100){
                    content.shift()
                }
                save_data("content",to_json(content),item)
                com.setItem(0,item)
                chatBoardBar(player,block,creater)
            })
        }
    }]
    
    if(get_id(player) === creater){
        ui.btns.push({
            text : get_text("board.clear"),
            icon : ui_icon.rubbish,
            func : ()=>{
                content = []
                save_data("content",to_json(content),item)
                com.setItem(0,item)
                chatBoardBar(player,block,creater)
            }
        })
    }
    ui.show(player)
}

function beforePlayerInteractWithEntity(event){
    var player = event.player
    var entity = event.target
    var item = event.itemStack
    
    if(config.land.able){
        var land = get_land_by_pos(player.dimension,entity.location)
        if(is_string(land.name)){
            if(land_member_level(player,land) === 0 && !array_has(to_array(land.other_per),"ie")){
                event.cancel = true
                land_unable_tip(player)
            }
            if((land_member_level(player,land) === 1 || land_member_level(player,land) === 2) && !array_has(to_array(land.mem_per),"ie")){
                event.cancel = true
                land_unable_tip(player)
            }
        }
    }
}

function land_unable_tip(player){
    system.run(()=>{
        setActionBar(player,"§e你无权在领地内操作")
    })
    player.last_warn = Date.now()
}

function beforePlayerInteractWithBlock(event){
    var player = event.player
    var block = event.block
    var item = event.itemStack
    
    if(config.land.able && !array_has(data_format.allow_blocks,block.typeId)){
        var land = get_land_by_pos(player.dimension,block.center())
        if(is_string(land.name)){
            if(land_member_level(player,land) === 0 && !array_has(to_array(land.other_per),"ib")){
                event.cancel = true
                land_unable_tip(player)
            }
            if((land_member_level(player,land) === 1 || land_member_level(player,land) === 2) && !array_has(to_array(land.mem_per),"ib")){
                event.cancel = true
                land_unable_tip(player)
            }
        }
    }
    
    if(block.typeId === "minecraft:lectern"){
        var com = block.getComponent("minecraft:inventory").container
        var b_item = com.getItem(0)
        if(!un(item) && un(b_item)){
            if(item.typeId === "minecraft:enchanted_book"){
                event.cancel = true
                system.run(()=>{
                    if(un(com.getItem(0))){
                        player.slots.setItem(player.selectedSlotIndex)
                        save_data("creater",get_id(player),item)
                        com.setItem(0,item)
                    }
                })
                return
            }
        }
        
        if(!un(b_item)){
            if(b_item.typeId === "minecraft:enchanted_book"){
                event.cancel = true
                system.run(()=>{
                chatBoardBar(player,block,get_data("creater",b_item))
                })
            }
        }
    }
    
    if(!un(item)){
        
        if(array_has(config.cd_items,item.typeId)){
            event.cancel = true
            system.run(()=>{
                cdBar(player)
            })
        }
    }
    
    if(block.hasTag("text_sign") && config.game.sign){
        if(Date.now() - to_number(player.last_edit_sign) < 800){

        }else{
            player.last_edit_sign = Date.now()
            setActionBar(player,get_text("sign.tip"))
            event.cancel = true
        }
    }

}

function beforeItemUse(event){
    var item = event.itemStack
    var player = event.source
    
    if(item.typeId === "minecraft:fire_charge"){
        if(config.game.fb){
            system.run(()=>{
                if(player.getGameMode() !== "creative"){
                    var slot = player.slots.getSlot(player.selectedSlotIndex)
                    if(slot.amount === 1){slot.setItem()}
                    else{
                        slot.amount = slot.amount -1
                    }
                }
                
                var lo = player.getHeadLocation()
                lo.x += player.getViewDirection().x
                lo.z += player.getViewDirection().z
                var ball = player.dimension.spawnEntity("minecraft:small_fireball",lo)
                ball.is_throw = player
                ball.getComponent("minecraft:projectile").shoot(player.getViewDirection(),{uncertainty : false})
            })
        }
    }
}

function afterPlayerGameModeChange(event){
    server_log(0,`GameMode changed:${event.toGameMode}`,get_player_path(event.player))

    if(!config.game.lock){
        return
    }
    var player = event.player
    if(get_op_level(player) === 0){
        if(event.toGameMode !== "survival"){
            set_mode(player,0)
        }
    }
}

function say_stop_talk(player){
    chat(format("talk.stop",[String(Math.round(get_left_time(player)/1000))]),[player])
}

function beforeChatSend(event){
    var sender = event.sender
    var message = event.message
    var format = config.chat.format

    if(message[0] === "+"){
        event.cancel = true
        system.run(()=>{
            run_command(sender , message)
        })
        return
    }

    if(config.chat.disable === true){
        return
    }
    for(var w of white_words){
        if(message.includes(w)){
            return
        }
    }

    if(message.length > config.chat.length){
        message = message.slice(0,config.chat.length)
        message += "..."
    }
    if(config.chat.clear){
        message = clear_colour(message)
    }
    format = tran_text(sender,format)
    format = format.replaceAll("/sender" , sender.name)
    format = format.replaceAll("/text" , message)

    event.cancel = true

    if(get_left_time(sender) > 0){
        say_stop_talk(sender)
        return
    }
    var t = get_chat_players()
    switch(sender.talk.mode){
        case 0:
            break
        case 1:
            if(sender.talk.goal.isValid()){
                t = [sender.talk.goal,sender]
                format = "[§e私聊§r]" + format
            }else{
                sender.talk.mode = 0
                t = []
                chat(get_text("talk.public"),[sender])
            }
            break
        case 2:
            var g = get_group(sender.talk.goal)
            if(is_group(g)){
                t = []
                for(var p of g.member){
                    t.push(get_player_by_id(p))
                }
                t.push(get_player_by_id(g.creater))
                array_clear(t,null)

                if(is_array(group_mess[g.id])){
                    group_mess[g.id].push(format.slice(0,60))
                }else{
                    group_mess[g.id] = [format.slice(0,60)]
                }

                format = `[§e${g.name}§r]` + format

            }else{
                t = []
                chat(get_text("talk.public.group"),[sender])
            }
            break
    }
    
    chat(format,t,false)
    if(array_has(config.log.allow,"chat")){
        server_log(0,format,"Chat")
    }
    if(array_has(config.log.allow,"chat_")){
        server_log(1,format)
    }
    
}

function afterEntitySpawn(event){
    var entity = event.entity
    if(!is_player(entity)){
        if(array_has(config.ban_entity,entity.typeId)){
            entity.remove()
        }
    }
    if(entity.typeId === "minecraft:item"){
        item_count += 1
        
        var com = entity.getComponent("minecraft:item")
        if(!un(com)){
            if(array_has(config.ban_item,com.itemStack.typeId)){
                entity.remove()
            }
        }
    }
    
}

function beforeBlockPlace(event){
    var player = event.player
    var block = event.block
    
    if(config.land.able){
        var land = get_land_by_pos(player.dimension,block.center())
        if(is_string(land.name)){
            if(land_member_level(player,land) === 0 && !array_has(to_array(land.other_per),"pb")){
                event.cancel = true
                land_unable_tip(player)
            }
            if((land_member_level(player,land) === 1 || land_member_level(player,land) === 2) && !array_has(to_array(land.mem_per),"pb")){
                event.cancel = true
                land_unable_tip(player)
            }
        }
    }
}

function afterBlockPlace(event){
    var player = event.player
    var block = event.block
    var id = no_minecraft(block.typeId)

    score_event(player,"pb")
    player.block_places = to_number(player.block_places) + 1
    if(array_has(config.log.allow,"pb")){
        log_info.pb[player.name] = to_object(log_info.pb[player.name])
        log_info.pb[player.name][id] = to_array(log_info.pb[player.name][id])

        log_info.pb[player.name][id].push(get_block_pos_di(block))
    }

    if(block.hasTag("text_sign") && array_has(config.log.allow,"sign") && config.log.able && sign[get_block_pos_di] == undefined){
        var com = block.getComponent("minecraft:sign")
        sign[get_block_pos_di(block)] = {
            block : block,
            id : block.typeId,
            player : player.name,
            before : [com.getText("Front"),com.getText("Back")],
            now : [com.getText("Front"),com.getText("Back")]
        }
        server_log(0,"Edit Sign"+get_block_pos_di(block),get_player_path(player))
    }
}

function beforeBlockBreak(event){
    var player = event.player
    var block = event.block
    
    if(config.land.able){
        var land = get_land_by_pos(player.dimension,block.center())
        if(is_string(land.name)){
            if(land_member_level(player,land) === 0 && !array_has(to_array(land.other_per),"bb")){
                event.cancel = true
                land_unable_tip(player)
            }
            if((land_member_level(player,land) === 1 || land_member_level(player,land) === 2) && !array_has(to_array(land.mem_per),"bb")){
                event.cancel = true
                land_unable_tip(player)
            }
        }
    }
}
function afterBlockBreak(event){
    var player = event.player
    var block = event.block
    var broken = event.brokenBlockPermutation
    var id = no_minecraft(broken.type.id)
    score_event(player,"bb")

    if(array_has(config.log.allow,"bb")){
        log_info.bb[player.name] = to_object(log_info.bb[player.name])
        log_info.bb[player.name][id] = to_array(log_info.bb[player.name][id])

        log_info.bb[player.name][id].push(get_block_pos_di(block))
    }

}

function is_same_day(d1,d2){
    return (d1.setHours(0, 0, 0, 0) == d2.setHours(0, 0, 0, 0))
}

function playerSpawn(event){
    var player = event.player
    var is_login = false
    
    if(event.initialSpawn === true){
    player.runCommand("scoreboard players set @s usf_data 1")
    player.info = parse_json(get_data("info",player))
    if(un(player.info.last_time)){
        is_login = true
    }else{
        var d1 = new Date(player.info.last_time)
        var d2 = new Date()
        if(is_same_day(d1,d2) === false){
            player.info.score = {}
            is_login = true
            
        }
    }

    if(is_object(player.info.follow)){
        reset_player_follow(player)
    }
    player.info.last_time = Date.now()
    player.info.join_times = to_number(player.info.join_times,0) +1
    

    object_override(player.info,data_format.info)
    save_player_info(player)
    
    reset_player_data(player)

    if(is_login){
        score_event(player,"login")
    }
    
    array_clear(ids,get_id(player))
    ids.push(get_id(player))
    try{
        if(ids.length > 200){
            delete id_names[ids.shift()]
        }
    }catch(err){}
    id_names[get_id(player)] = player.name
    save_data("id_names",to_json(id_names))
    save_data("ids",to_json(ids))

    if(get_owners().length === 0){
        chat(get_text("tip.init"),[player],false)
    }
    show_board(player)
    //show_tips(player)

    if(config.game.r_in > 0){
        player.addEffect("resistance",config.game.r_in*20,{
            amplifier : 4,
            showParticles : false
        })
    }
    if(array_has(config.log.allow,"jl")){
        server_log(0,`Join At ${get_block_pos_di(player)}`,get_player_path(player))
    }
    
    }else{
        if(config.game.r_rs > 0){
            player.addEffect("resistance",config.game.r_rs*20,{
                amplifier : 4,
                showParticles : false
            })
        }
    }

    reset_lock_item(player)
}

function afterPistonActivate(event){
    var block = event.block
    var piston = event.piston
    
    return
}

function afteritemUse(event){
    var item = event.itemStack
    var player = event.source
    
    if(typeof(item) === "object"){
        if(item.typeId === "usf:op"){
            if(get_op_level(player) >= 1){
                opBar(player)
            }
        }
    }
}

function beforeEntityRemove(event){
    var entity = event.removedEntity
    if(entity.typeId === "minecraft:item"){
        item_count -= 1
    }

    if(entity.typeId === "minecraft:small_fireball"){
        if(is_object(entity.is_throw)){
            var di = entity.dimension
            var lo = entity.location
            var source = entity.is_throw
            system.run(()=>{
                di.createExplosion(lo,1,{
                    breaksBlocks : true,
                    causesFire : true,
                    source : source
                })
            })
        }
    }
}
function afterEntityLoad(event){
    var entity = event.entity
}

function worldInitializeEvent(event){
    log("——USF加载中——",[],"info",2)
    try{
    var time = Date.now()
    
    
    reload_all()
    
    for(var cf of world.getAllPlayers()){
        reset_player_data(cf)
    }

    
        
    reloaded = true
    time = Date.now() - time
    log(`——USF加载成功——时间:[0]ms`,[time],"info",2)
    }catch(err){
        log(`——USF加载失败！——\n§c[Error:§r[0]§c]`,[err],"error",2)
    }finally{
        log(`——USF加载结束——`,[],"info",2)
    }
}

function afterWeatherChanged(event){
    var weaText = "Wearther."
    if(event.raining){
        weaText += "Rain"
        if(event.lightning){
            weaText += ".Thunder"
        }
    }else{
        if(event.lightning){
            weaText += "Thunder"
        }else{
            weaText += "Clear"
        }
    }
    tran_info.weather = weaText
}

function afterPlayerDimensionChange(event){
    var player = event.player
    var to = event.toDimension
    var from = event.fromDimension

    if(array_has(config.log.allow,"di")){
        server_log(0,`Dimension Change:${from.name} to ${to.name}`,get_player_path(player))
    }
    if(config.game.r_di > 0){
        player.addEffect("resistance",config.game.r_di*20,{
            amplifier : 4,
            showParticles : false
        })
    }
    player.landing.points = []
}

function afterEntityHurt(event){
    var hurt = event.hurtEntity
    var hurter = event.damageSource.damagingEntity
    
    if(typeof(hurter) === "object"){
    if (hurter.typeId == "minecraft:player"){
        if(is_player(hurter)){
            score_event(hurter,"hit")
        }

        if(hurt.hasComponent("minecraft:health")){
        var max = event.hurtEntity.getComponent("minecraft:health").effectiveMax
        var now = event.hurtEntity.getComponent("minecraft:health").currentValue
        if(config.hurt.able && now >= 0){
            var text = ""
            var level = now / max *100
            level = (level <= 100)? level : 100
            switch(config.hurt.type){
                case 0:
                    text += "§a"
                    for(var cf =0 ; cf < Math.ceil(level/5) ; cf++){
                        text += "||"
                    } 
                    text += "§f"
                    for(var cf = 0;cf < 20 - Math.ceil(level/5) ; cf++){
                        text += "||"
                    }
                    text += "  "+ String(Math.round(now)) + "/" + String(Math.round(max))
                    break
                case 1:
                    if(now <= 20){
                        for(var cf=0;cf<Math.ceil(now/2);cf++){
                            text += ""
                        }
                    }
                    else{
                        text = " × "+String(Math.ceil(now/2))
                    }
                    break
            }
            try{
                setActionBar(hurter, text )
            }catch(err){}
        }
        /* if (){
        
        
        for(var cf = 0;cf <= 95;cf = cf+5){
            if(level > cf){
                text += "§a"
            }else{
                text += "§f"
            }
            text += "|"
        }
        text += "\n§a"
        text += `${Math.round(now)} / ${Math.round(max)}§r)`
        if(1 === 1){
            try{
                setActionBar(event.damageSource.damagingEntity, text )
            }catch(err){}
        }} */
        }
    }
    }
}

function get_player_hand_item(player){
    return player.slots.getItem(player.selectedSlotIndex)
}

function land_member_level(player,land){
    if(player.info.manager === true && get_op_level(player) > 0){
        return 4
    }
    if(land.creater === get_id(player)){
        return 3
    }
    if(array_has(land.member,player.name)){
        return 2
    }
    for(var g of get_player_groups(player)){
        if(array_has(land.group,String(g.id))){
            return 1
        }
    }
    return 0
}

function report_warn(type , op){
    if(config.hacker.kick){
        kick(op.player,"游戏中作弊")
    }
    
    var reports = get_reports()
    var text = "未知日志"
    switch(type){
        case "chest":
            text = `反作弊:${op.player.name}疑似使用"自动开箱"`
            break
        case "text":
            text = op.text
            break
    }
    
    reports.push(text)
    save_data("reports",to_json(reports))
}

function get_reports(){
    return to_array(parse_json(get_data("reports")))
}

function afterPlayerInteractWithBlock(event){
    var item = event.itemStack
    var block = event.block
    var player = event.player
    if(block.hasTag("text_sign")){
        if(array_has(config.log.allow,"sign") && config.log.able && sign[get_block_pos_di(block)] == undefined){
            var com = block.getComponent("minecraft:sign")
            sign[get_block_pos_di(block)] = {
                block : block,
                id: block.typeId,
                player : player.name,
                before : [com.getText("Front"),com.getText("Back")],
                now : [com.getText("Front"),com.getText("Back")]
            }
            server_log(0,"Edit Sign"+get_block_pos_di(block),get_player_path(player))
        }
    }


    var com = block.getComponent("minecraft:inventory")
    if(!un(com)){
        com = com.container
        var items = {}
        for(var i = 0 ; i< com.size ; i++){
            var item = com.getItem(i)
            if(!un(item)){
                items[no_minecraft(item.typeId)] = to_number(items[no_minecraft(item.typeId)]) + item.amount
            }
        }
        
        if(array_has(config.hacker.allow,"chest")){
            var count = com.emptySlotsCount
            var items_o = []
            for(var i = 0 ; i< com.size ; i++){
                items_o.push(com.getItem(i))
            }
            system.runTimeout(()=>{
                if(com.emptySlotsCount - count >= 5){
                    report_warn("chest",{
                        player : player,
                        block : block
                    })
                    if(config.hacker.back){
                        for(var i=0;i<items_o.length;i++){
                            com.setItem(i,items_o[i])
                        }

                        var ids = Object.keys(items)
                        var p_com = player.getComponent("minecraft:inventory").container
                        for(var i = 0 ; i< p_com.size ; i++){
                            var item = p_com.getItem(i)
                            if(!un(item)){
                                if(array_has(ids,no_minecraft(item.typeId))){
                                    p_com.setItem(i)
                                }
                            }
                        }
                    }
                }
            },8)

        }
        
        if(config.log.able && log_config.able && array_has(config.log.allow,"chest")){
            chest[get_block_pos_di(block)] = to_object(chest[get_block_pos_di(block)],{
            "block" : block,
            "players" : [],
            "items" : items,
            "typeId" : block.typeId
            })
            if(array_has(chest[get_block_pos_di(block)].players,player.name) === false){
                chest[get_block_pos_di(block)].players.push(player.name)
            }

            server_log(0,`Open ${no_minecraft(block.typeId)}${get_block_pos_di(block)}`,get_player_path(player))
        }     
    }

    if(is_player(player)){
        if(!un(item)){
            
        }else{
            if(player.landing.mode ===1){
                var can = false
                if(player.landing.points.length === 0){
                    can = true
                }else{
                    if(get_block_pos(block) !== get_block_pos(player.landing.points[player.landing.points.length -1])){
                        can = true
                    }
                }
                if(can){
                    show_title(player,get_text("point.get"))
                    player.landing.points.push({location : block.location,x:block.x,y:block.y,z:block.z,typeId:block.typeId})
                    if(player.landing.points.length > 2){
                        player.landing.points.shift()
                    }
                }
            }
        }
    }
}

function beforePlayerLeave(event){
    var player = event.player
    delete id_player[get_id(player)]
    var name = player.name

    system.run(()=>{
        if(array_has(config.log.allow,"jl")){
            server_log(0,"Leave",get_player_path({name:name}))
        }
    })
}

function scriptEventReceive(event){
    const id = event.id.slice("usf:".length)
    var message = event.message + " "
    var messages = []
    var type = event.sourceType
    //Server NPCDialogue Entity Block
    var block = event.sourceBlock
    var entity = event.sourceEntity
    var entity_player = false
    if(type === "Entity"){entity_player = is_player(entity)}
    
    var is_in = false
    //如果为true，则正在引号内
    var last_char = 0
    for(var i=0 ; i<message.length; i++){
        var c = message.charAt(i)
        if(c === "\""){
            is_in = is_in ? false : true
        }
        if(c === " " && !is_in){
            var part = message.slice(last_char,i).replaceAll("\"","")
            messages.push(part)
            last_char = i+1
        }
    }
    
    switch(id){
        case "reset":
            log("重置命令已发出，请于30秒内运行/reload命令即可重置owner")
            save_data("reset",String(Date.now()))
            break
        case "get_owner":
            if(type === "Entity" && entity_player){
                if(!has_owner){
                    save_data("owners",to_json([get_id(entity)]))
                    get_owners()
                }else{
                    log("已存在owner，请在Server使用命令，或从其他owner处获取。")
                }
                
            }
            if(type === "Server"){
                var owners = get_owners()
                for(var p of world.getAllPlayers()){
                    if(!array_has(owners,get_id(p))){
                        owners.push(get_id(p))
                    }
                }
                save_data("owners",to_json(owners))
                log("已给予全部在线玩家Owners",[],"warn",1)
            }
            break
        
        }
}


//界面

function groupLookBar(player , g , op = false){
    var ui = new btnBar()
    ui.title = format("group.init",[g.name])

    var text = [
        get_text("group.name") + g.name,
        get_text("group.id") + g.id,
        "————————————",
        get_text("group.announcement"),
        g.board,
        "————————————",
        get_text("group.owner") + get_name_by_id(g.creater),
        get_text("group.member")
    ]
    for(var p of g.member){
        text.push(get_name_by_id(p))
    }

    if(op){
        text.push("§e管理员编辑模式")
    }

    ui.body = text

    ui.btns.push({
        text : get_text("group.his"),
        icon : ui_icon.key_board,
        func :()=>{
            var ui = new btnBar()
            ui.body = g.message
            ui.title = `${g.name} - ${get_text("group.his")}`
            ui.btns = [{
                text : get_text("back"),
                icon : ui_icon.back,
                func : ()=>{
                    groupLookBar(player,get_group(g.id))
                }
            }]
            ui.show(player)
        }
    })
    
    if(g.creater === get_id(player) || op === true){
        ui.btns.push({
            text: "编辑信息",
            icon : ui_icon.edit,
            func :()=>{
                editGroupBar(player,g)
            }
        })
        ui.btns.push({
            text: "添加成员",
            icon : ui_icon.add,
            func :()=>{
                var ps = []
                for(var p of world.getAllPlayers()){
                    if(!is_group_has(g,p)){
                        ps.push(p)
                    }
                }
                choosePlayer(player,ps,(players)=>{
                    if(players.length === 0){
                        tip(player,"无玩家可选择或未选择玩家！",()=>{
                            groupLookBar(player , g)
                        })
                    }else{
                        for(var p of players){
                            add_invite(p , g.id)
                        }
                        tip(player,`已向${players.length}位玩家发送邀请！`,()=>{
                            groupLookBar(player , g)
                        })
                    }
                })
            }
        })
        if(g.member.length > 0){
            ui.btns.push({
                text : "删除成员",
                icon : ui_icon.stop,
                func : ()=>{
                    var ui = new infoBar()
                    ui.title = "删除成员"
                    for(var id of g.member){
                        ui.toggle(id,get_name_by_id(id),false)
                    }
                    ui.show(player,(r)=>{
                        for(var k of Object.keys(r)){
                            if(r[k] === true){
                                array_clear(g.member,k)
                            }
                        }
                        save_group(g)
                        groupLookBar(player , get_group(g.id))
                    })
                }
            })
        }
        if(g.in.length > 0){
            ui.btns.push({
                text : "加群申请",
                icon : ui_icon.compass,
                func : ()=>{
                    var ui = new infoBar()
                    ui.title = "申请列表"
                    for(var i of g.in){
                        ui.toggle(i,get_name_by_id(i) + "[拒绝 | 同意]",false)
                    }
                    ui.show(player,(r)=>{
                        for(var k of Object.keys(r)){
                            if(r[k] === true){
                                g.member.push(k)
                            }
                        }
                        g.in = []
                        save_group(g)
                        groupLookBar(player , get_group(g.id))
                    })
                }
            })
        }
        ui.btns.push({
            text : "解散群组",
            icon : ui_icon.delete,
            func : ()=>{
                confirm(player,"确认解散群组？你将和所有群员失去联系！",(r)=>{
                    if(r){
                        save_data("group"+g.id,"")
                        array_clear(groups,g.id)
                        save_groups()
                        groupsBar(player)
                    }else{
                        groupLookBar(player , get_group(g.id))
                    }
                })
            }
        })
    }else{
        ui.btns.push({
            text : "退出群组",
            icon : ui_icon.delete,
            func : ()=>{
                confirm(player,"确认退出群组？你将和所有群员失去联系！",(r)=>{
                    if(r){
                        array_clear(g.member,get_id(player))
                        save_group(g)
                        groupsBar(player)
                    }else{
                        groupLookBar(player , get_group(g.id))
                    }
                })
            }
        })
    }
    ui.show(player)
}

function confirm(player , text , back = function(r){}){
    var ui = new btnBar()
    ui.title = "确认"
    ui.body = text
    ui.btns = [{
        text :"确认",
        icon : ui_icon.ok,
        func : ()=>{
            back(true)
        }
    },{
        text :"取消",
        icon : ui_icon.delete,
        func : ()=>{
            back(false)
        }
    }]
    ui.cancel = ()=>{
        back(false)
    }
    ui.show(player)
}

function add_invite(player , id){
    var invites = to_array(parse_json(get_data("invites",player)),[])
    if(!array_has(invites,id)){
        invites.push(id)
        chat("[群组]你收到一条群组邀请！请前往查看！",[player])
    }
    save_data("invites",to_json(invites),player)
}

//该函数返回的是选择的things的index
function chooseBar(player , things = [] , back = function(options){}){
    if(things.length <= 0){
        back([])
        return 
    }
    var ui = new infoBar()
    ui.title = "选择器"
    for(var t=0;t<things.length;t++){
        ui.toggle("things",things[t],false)
    }


    ui.show(player,(r)=>{
        if(!is_array(r.things)){
            r.things = [r.things]
        }
        var result = []
        for(var i=0;i<r.things.length;i++){
            if(r.things[i]){
                result.push(i)
            }
        }
        back(result)
    })
}

function choosePlayer(player , ps , back = function(pps){}){
    if(ps.length <= 0){
        back([])
        return 
    }
    var ui = new infoBar()
    ui.title = "玩家选择器"
    for(var p of ps){
        ui.toggle("players",p.name,false)
    }


    ui.show(player,(r)=>{
        if(!is_array(r.players)){
            r.players = [r.players]
        }
        var pps = []
        for(var i=0;i<r.players.length;i++){
            if(r.players[i]){
                pps.push(ps[i])
            }
        }
        back(pps)
    })
}

function editGroupBar(player,g){
    var new_g = false
    if(!is_group(g)){
        new_g = true
        g = {
            creater : "",
            member : [],
            message : [],
            name : "",
            board : "",
            pos : [],
            in : [],
            id : get_random_group_id()
        }
    }
    

    var ui =new infoBar()
    ui.title = "编辑群组"
    ui.input("name","群名","输入群名",g.name)
    ui.input("board","公告","输入公告",g.board)

    ui.show(player,(r)=>{
        g.name = r.name
        g.board = r.board
        g.creater = get_id(player)
        if(new_g){
            player_add_group(player , g.id)
        }
        save_group(g)
        groupLookBar(player , get_group(g.id))
    })
}

function get_land_by_pos(di,pos){
    var dis = Math.sqrt(Math.pow(Math.abs(pos.x),2) + Math.pow(Math.abs(pos.z),2))
    var ix = two_find_min(lands.min,dis)
    if(ix === -1){
        return {}
    }
    for(var i = ix;i >= 0 ;i--){
        if(lands.max[i] < dis){
            return {}
        }
        var land = get_land(lands.ids[i])
        if(is_string(land.name)){
            if(di.id === land.di){
                if(is_between(pos.y,land.from.y,land.to.y) && is_between(pos.x,land.from.x,land.to.x) && is_between(pos.z,land.from.z,land.to.z)){
                    return land
                }
            }
        }
    }
    return {}
}

function is_group_has(g , player){
    if(g.creater === get_id(player) || array_has(g.member,get_id(player))){
        return true
    }return false
}

function addGroupBar(player){
    var ui =new infoBar()
    ui.busy = ()=>{
        groupsBar(player)
    }
    ui.title = "加入群组"
    ui.input("id","加入的群ID","输入群ID","")
    ui.show(player,(r)=>{
        var g = get_group(r.id)
        if(is_group(g)){
            if(is_group_has(g,player)){
                tip(player,"你已经在该群组内！",()=>{
                    groupsBar(player)
                })
            }else{
                g.in.push(get_id(player))
                save_group(g)

                var my_invites = to_array(parse_json(get_data("my_in",player)),[])
                if(!array_has(my_invites,g.id)){
                    my_invites.push(g.id)
                }
                save_data("my_in",to_json(my_invites),player)

                tip(player,"已发送请求!",()=>{
                    groupsBar(player)
                })
            }   
        }else{
            tip(player,"该群组不存在！",()=>{
                groupsBar(player)
            })
        }
    })
}

function myInvitationBar(player){
    var invites = to_array(parse_json(get_data("invites",player)),[])
    var used = 0
    
    var ui = new infoBar()
    ui.title = "邀请请求"
    for(var i of invites){
        var g = get_group(i)
        if(is_group(g) && !is_group_has(g,player)){
            ui.toggle(i,`${get_group(i).name}(群主:${get_name_by_id(g.creater)})\n[拒绝 | 同意]`)
            used += 1
        }
    }    
    if(used === 0){
        tip(player,"当前无请求！",()=>{
            groupsBar(player)
        })
        return
    }
    ui.show(player,(r)=>{
        for(var id of Object.keys(r)){
            if(r[id]){
                var g = get_group(id)
                group_add_member(g,player)
            }
        }
        save_data("invites","",player)
        groupsBar(player)
    })
}

function group_add_member(g,player){
    if(!is_group_has(g,player)){
        g.member.push(get_id(player))
        player_add_group(player,g.id)
        save_group(g)
    }
}

function groupsBar(player){
    var my_invites = to_array(parse_json(get_data("my_in",player)),[])
    var group_ids = to_array(parse_json(get_data("groups",player)),[])

    for(var i of my_invites){
        var g = get_group(i)
        if(is_group(g) && !array_has(group_ids,i)){
            if(is_group_has(g,player)){
                player_add_group(player,i)
                array_clear(my_invites,i)
            }
        }
    }
    save_data("my_in",to_json(invites))

    var invites = to_array(parse_json(get_data("invites",player)),[])
    var groups = get_player_groups(player)
    
    var creater_groups = []

    var ui = new btnBar()
    ui.title = "我的群组"
    ui.body = "管理你的群组"
    for(var i=0;i<groups.length;i++){
        var g = groups[i]
        ui.btns.push({
            text : `${g.name}\n群主:${get_name_by_id(g.creater)}`,
            op : {
                g : groups[i]
            },
            func : (op)=>{
                groupLookBar(player ,op.g)
            }
        })
        if(g.creater === get_id(player)){
            creater_groups.push(g)
        }
    }

    if(creater_groups.length < config.groups.max || get_op_level(player) > 0){
        ui.btns.push({
            text : "新建群组",
            icon : ui_icon.add,
            func : ()=>{
                editGroupBar(player,{})
            }
        })
    }

    ui.btns.push({
        text : "加入群组",
        icon : ui_icon.more,
        func : ()=>{
            addGroupBar(player)
        }
    })
    ui.btns.push({
        text : `群组邀请(${invites.length})`,
        icon : ui_icon.share,
        func : ()=>{
            myInvitationBar(player)
        }
    })

    ui.show(player)
}

function setChatBar(player){
    var texts = ["公共聊天"]
    var ops = [null]
    for(var p of world.getAllPlayers()){
        ops.push(p)
        texts.push(`私聊-${p.name}`)
    }
    for(var g of get_player_groups(player)){
        ops.push(String(g.id))
        texts.push(`群聊-${g.name}`)
    }
    var ui =new infoBar()
    ui.title = "聊天设置"
    ui.options("goal","聊天对象",texts,0)

    ui.show(player,(r)=>{
        if(r.goal === 0){
            player.talk.mode = 0
        }else{
            if(is_string(ops[r.goal])){
                player.talk.mode = 2
                player.talk.goal = ops[r.goal]
            }else{
                player.talk.mode = 1
                player.talk.goal = ops[r.goal]
            }
        }
    })
}

function is_public_editable(player){
    if(get_op_level(player) > 0){
        return true
    }
    return false
}

function is_pos(pos){
    if(un(pos.name)){
        return false
    }
    return true
}

function to_pos(player,pos){
    if(Date.now() - player.last_tp < config.tp.down * 1000){
        tip(player,"传送功能冷却中...请稍后尝试！","")
        return
    }
    tp_entity(player,get_di(pos.di),pos.x,pos.y,pos.z,true,false,true)
    player.last_tp = Date.now()
}

function get_pos_name(pos){
    return `[${get_di(pos.di).name}]${pos.name}`
}

function editPosBar(player,pos,save = function(){},back = function(){}){
    var ui = new infoBar()
    var poss = [null,null]
    var texts = ["保持位置","当前位置"]
    ui.cancel = ()=>{
        back()
    }
   
    if(Object.keys(pos).length === 0){
        object_override(pos,{
            "owner" : get_id(player),
            "di" : player.dimension.id,
            "x" : player.location.x,
            "y" : player.location.y,
            "z" : player.location.z,
            "name" : "",
            "icon" : null,
            "home" : false,
        })
        texts = ["当前位置","当前位置"]
        ui.cancel = ()=>{
            pos.name = undefined
            save()
            back()
        }
    }

    for(var p of get_player_personal_pos()){
        poss.push(p)
        texts.push(get_pos_name(p))
    }

    
    ui.title = "编辑传送点"
    ui.input("name","传送点名称","输入名称",pos.name)
    add_pictures_choice(ui,"选择传送点图标",pos.icon)
    ui.options("lo","位置",texts,0)
    ui.toggle("home","设为Home(仅个人传送点有效)",pos.home)

    ui.show(player,(r)=>{
        pos.name = r.name
        pos.icon = r.icon
        pos.home = r.home
        switch(r.lo){
            case 0:

                break
            case 1:
                pos.x = player.location.x
                pos.y = player.location.y
                pos.z = player.location.z
                pos.di = player.dimension.id
                break
            default:
                pos.x = poss[r.lo].x
                pos.y = poss[r.lo].y
                pos.z = poss[r.lo].z
                break
        }

        save()
        var ui2 = new btnBar()
        viewPosBar(player , pos , true , ui2 , save,back)
    })
}

function pos_to_text(pos){
    return `(${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)})`
}

function save_player_store_record(player){
    save_data("store_record",to_object(player.store_record),player)
}

function viewPosBar(player , pos , editable , ui = new btnBar() , save = function(){} , back = function(){}){
    
    ui.title = `传送点 - ${pos.name}`
    ui.cancel = ()=>{
        back()
    }
    ui.body =[
        "传送点:" + pos.name,
        `创建者:${get_name_by_id(pos.owner)}`,
        `维度:${get_di(pos.di).name}`,
        `坐标:${pos_to_text(pos)}`
    ]

    ui.btns = [{
        text : "传送",
        icon : ui_icon.go,
        func : ()=>{
            to_pos(player,pos)
        }
    }]
    
    if(config.tp.share){
        ui.btns.push({
            text : "分享",
            icon : ui_icon.share,
            func : ()=>{
                sharePosBar(player,pos)
            }
        })
    }
    if(editable){
        ui.btns = ui.btns.concat([{
            text : "编辑",
            icon : ui_icon.edit,
            func : ()=>{
                editPosBar(player,pos,save,back)
            }
        },
        {
            text : "删除",
            icon : ui_icon.delete,
            func : ()=>{
                delete pos.name
                save()
                back()
            }
        }])
    }
    ui.show(player)
}

function save_player_pos(player){
    for(var pos of player.pos){
        if(un(pos.name)){
            player.pos.splice(player.pos.indexOf(pos),1)
        }
    }
    save_data("pos",to_json(player.pos),player)
}
function get_player_pos(player){
    return to_array(parse_json(get_data("pos",player)))
}

function get_score(ob,player){
    var s = 0
    try{
        s = ob.getScore(player)
    }catch(err){}
    return s
}

function tranBar(player){
    var board = config.tran.board
    board = board.split(";")

    var obs = []
    for(var id of board){
        var ob = world.scoreboard.getObjective(id)
        if(!un(ob)){
            obs.push(ob)
        }
    }

    if(obs.length === 0){
        chat("§e[转账机]当前无可转账项目",[player])
        return
    }

    var obs_name = []
    for(var i=0;i<obs.length;i++){
        obs_name.push(obs[i].displayName + " - 剩余:" + String(get_score(obs[i],player)))
    }

    var players = world.getAllPlayers()
    var ps_name = []
    for(var i=0;i<players.length;i++){
        ps_name.push(players[i].name)
    }

    var ui = new infoBar()
    ui.title = "转账机"
    ui.options("id","转账项目",obs_name,0)
    ui.input("money",`输入整数数额(手续费:${config.tran.free}％)`,"款数","")
    ui.options("p","玩家",ps_name,0)
    ui.show(player,(r)=>{
        var count = to_number(parseInt(r.money))
        if(count > 0){
            var text = [
                `余额:${get_score(obs[r.id],player)}`,
                `你将转账给:${players[r.p].name}`,
                `数目:${String(count)}`,
                `实付:${Math.ceil(count * (1+config.tran.free/100))}`,
                "确认转账？"
            ]
            confirm(player,text,(r2)=>{
                if(r2 === true){
                    if(get_score(obs[r.id],player) - count * (1+config.tran.free/100) >= 0){
                        players[r.p].runCommand(`scoreboard players add @s ${obs[r.id].id} ${String(count)}`)
                        player.runCommand(`scoreboard players remove @s ${obs[r.id].id} ${String(Math.ceil(count * (1+config.tran.free/100)))}`)
                        chat("§e[转账机]转账成功！",[player])
                    }
                    else{
                        chat("§e[转账机]余额不足！",[player])
                    }
                }else{
                    tranBar(player)
                }
            })
        }else{
            chat("§e[转账机]无法识别您输入的款数！",[player])
        }
    })
}

function groupPosBar(player){
    var ui = new btnBar()
    ui.title = "群组公共点"
    ui.body = "管理所有群组的传送点"
    ui.cancel = ()=>{
        posBar(player)
    }

    var groups = get_player_groups(player)
    if(groups.length === 0){
        tip(player,"您未加入任何群组！",()=>{
            posBar(player)
        })
        return
    }
    for(var group of groups){
        for(var pos of group.pos){
            ui.btns.push({
                text : `[${group.name}]\n[${get_di(pos.di).name}]${pos.name}`,
                icon : pictures[pos.icon],
                op : {
                    "pos" : pos,
                    "group" : group
                },
                func : (op)=>{
                    var ui2 = new btnBar()
                    ui2.cancel = ()=>{
                        groupPosBar(player)
                    }
                    viewPosBar(player , op.pos , true , ui2 ,()=>{
                        for(var p of op.group.pos){
                            if(un(p.name)){
                                op.group.pos.splice(op.group.pos.indexOf(p),1)
                            }
                        }
                        save_group(op.group)
                    } ,()=>{
                        groupPosBar(player)
                    })
                }
            })
        }
    }
    ui.btns.push({
        text : "添加传送点",
        icon : ui_icon.add,
        func : ()=>{
            var groups = get_player_groups(player)
            var can_groups = []
            for(var group of groups){
                if(group.pos.length < 30){
                    can_groups.push(group)
                }
            }
            
            if(can_groups.length === 0){
                tip(player,"当前无队伍可添加传送点！",()=>{
                    groupPosBar(player)
                })
            }else{
                var group_names = []
                for(var i=0;i<can_groups.length;i++){
                    group_names.push(can_groups[i].name)
                }
                var ui = new infoBar()
                ui.title = "选择队伍"
                ui.cancel = ()=>{
                    groupPosBar(player)
                }
                ui.options("index","选择队伍",group_names,0)
                ui.show(player,(r)=>{
                    var id = can_groups[r.index].id
                    var group = get_group(id)
                    group.pos.push({})
                    editPosBar(player,group.pos[group.pos.length - 1],()=>{
                        for(var p of group.pos){
                            if(un(p.name)){
                                group.pos.splice(group.pos.indexOf(p),1)
                            }
                        }
                        save_group(group)
                    },()=>{
                        groupPosBar(player)
                    })
                })
            }
        }
    })

    ui.show(player)
}

function worldPosBar(player){
    var ui = new btnBar()
    ui.title = "世界公共点"
    ui.body = "管理世界的传送点"
    for(var pos of world_pos){
        ui.btns.push({
            text : `[${get_di(pos.di).name}]${pos.name}`,
            icon : pictures[pos.icon],
            op : {
                "pos" : pos
            },
            func : (op)=>{
                var ui2 = new btnBar()
                ui2.cancel = ()=>{
                    worldPosBar(player)
                }
                viewPosBar(player , op.pos , (get_id(player) === op.pos.owner || get_op_level(player) > 0) , ui2 ,()=>{
                    save_world_pos()
                } ,()=>{
                    worldPosBar(player)
                })
            }
        })
    }
    if(world_pos.length < 100){
        ui.btns.push({
            text : "添加传送点",
            icon : ui_icon.add,
            func : ()=>{
                world_pos.push({})
                editPosBar(player,(world_pos[world_pos.length-1]),()=>{
                    save_world_pos()
                },()=>{
                    worldPosBar(player)
                })
            }
        })
    }

    ui.show(player)
}

function personalPosBar(player,goal){
    var ui = new btnBar()
    ui.title = "个人传送点"
    ui.body = "管理您的传送点"
    for(var pos of goal.pos){
        ui.btns.push({
            text : `[${get_di(pos.di).name}]${pos.name}`,
            icon : pictures[pos.icon],
            op : {
                "pos" : pos
            },
            func : (op)=>{
                var ui2 = new btnBar()
                ui2.cancel = ()=>{
                    personalPosBar(player,goal)
                }
                viewPosBar(player , op.pos , true , ui2 ,()=>{
                    save_player_pos(goal)
                } ,()=>{
                    personalPosBar(player,goal)
                })
            }
        })
    }
    if(goal.pos.length < config.tp.per_count){
        ui.btns.push({
            text : "添加传送点",
            icon : ui_icon.add,
            func : ()=>{
                goal.pos.push({})
                editPosBar(player,(goal.pos[goal.pos.length-1]),()=>{
                    save_player_pos(goal)
                },()=>{
                    personalPosBar(player,goal)
                })
            }
        })
    }
    if(get_op_level(player) > 0){
        ui.btns.push({
            text : "管理玩家个人点",
            icon : ui_icon.edit,
            func : ()=>{
                choosePlayer(player,world.getAllPlayers(),(ps)=>{
                    if(ps.length > 0){
                        personalPosBar(player,ps[0])
                    }else{
                        personalPosBar(player,goal)
                    }
                })
            }
        })
    }

    ui.show(player)
}

function sharePosBar(player,pos){
    var ui = new infoBar()
    ui.title = "分享坐标点"
    ui.range("time","分享时间/秒",10,600,10,300)
    ui.options("p","分享玩家",["所有玩家","部分玩家"],0)
    ui.show(player,(r)=>{
        var p = {...pos}
        p.time = Date.now() + r.time*1000
        switch(r.p){
            case 0:
                var list = []
                for(var pl of world.getAllPlayers()){
                    list.push(get_id(pl))
                }
                p.list = list
                break
            case 1:
                var list = []
                choosePlayer(player,world.getAllPlayers(),(ps)=>{
                    for(var pl of ps){
                        list.push(get_id(pl))
                    }
                })
                p.list = list
                break
        }
        share_pos.push(p)
    })
}

function random_tp(player,now){
    tp_entity(player,player.dimension,player.location.x+get_random_tp_range(),400,player.location.z+get_random_tp_range(),true)
                var id = system.runInterval(()=>{
                    var time = Date.now()
                    var lo = player.location
                    var block = get_block(player.dimension,{x:lo.x,y:64,z:lo.z})
                    if(!un(block)){
                        for(var i = 100;i>player.dimension.heightRange.min;i--){
                            lo.y = i
                            var b = get_block(player.dimension,lo)
                            if(!un(b)){
                                if(!b.isAir){
                                    b = get_block(player.dimension,{x:lo.x , y:lo.y +2 ,z:lo.z})
                                    if(!un(b)){
                                        if(b.isAir){
                                            b = get_block(player.dimension,{x:lo.x , y:lo.y +1 ,z:lo.z})
                                            if(!un(b)){
                                                if(b.isAir){
                                                    break
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        tp_entity(player,player.dimension,lo.x,lo.y+1,lo.z,false)
                        system.clearRun(id)
                    }
                },20)
                player.last_tp = now
}

function posBar(player){
    push_text("pos.body","此处保存您的所有传送点/n您可以编辑、修改、分享传送点")
    push_text("pos.name","传送系统")
    
    
    var now = Date.now()
    var ui = new btnBar()
    ui.title = get_text("pos.name")
    ui.body = tran_text(player,get_text("pos.body"))
    for(var pos of public_pos){
        ui.btns.push({
            text : `[公共]${pos.name}`,
            icon : pictures[pos.icon],
            op :{
                "pos" : pos
            },
            func : (op)=>{
                var ui2 = new btnBar()
                ui2.cancel = ()=>{
                    posBar(player)
                }
                viewPosBar(player , op.pos , is_public_editable(player) , ui2 ,()=>{
                    save_public_pos()
                } ,()=>{
                    posBar(player)
                })
            }
        })
    }
    
    for(var pos of share_pos){
        if(now > pos.time || !is_number(pos.time) || !is_string(pos.name)){
            delete share_pos[pos]
        }else{
            if(array_has(pos.list,get_id(player))){
                ui.btns.push({
                    text : `[分享][${get_di(pos.di).name}]${pos.name}\n剩余时间:${-Math.round((now - pos.time)/1000)}s`,
                    icon : pictures[pos.icon],
                    op : {
                        "pos":pos
                    },
                    func : (op)=>{
                        var ui2 = new btnBar()
                        ui2.cancel = ()=>{
                            posBar(player)
                        }
                        viewPosBar(player , op.pos , is_public_editable(player)  , ui2 ,function(){},()=>{
                            posBar(player)
                        })
                    } 
                })
            }
            
        }
    }

    if(config.tp.pp){
        ui.btns.push({
            text : "传送玩家",
            icon : ui_icon.heart,
            func : ()=>{
                var ps = world.getAllPlayers()
                var names = []
                for(var i=0;i<ps.length;i++){
                    names.push(ps[i].name)
                }
                var ui = new infoBar()
                ui.title = "传送玩家"
                ui.options("p","选择玩家",names,0)
                ui.options("mode","方向",["你 > 对方","对方 > 你"],0)
                ui.show(player,(r)=>{
                    var goal = ps[r.p]
                    goal.tpa = {
                        goal : player,
                        mode : r.mode,
                        time : Date.now()+60*1000
                    }
                    chat(`玩家${player.name}向你发起传送请求\n方向${r.mode === 0 ? "对方 > 你":"你 > 对方"}\n一分钟内输入+tpaccept即可传送`,[goal])
                })
            }
        })
    }
    if(config.tp.die && !un(player.last_die) && now - player.last_tp > config.tp.down*1000){
        var die = player.last_die
        ui.btns.push({
            text : "返回死亡点",
            icon : ui_icon.die,
            func : ()=>{
                tp_entity(player,die.di,die.x,die.y,die.z,true)
            }
        })
    }
    if(config.tp.back && is_array(player.back_pos)){
        ui.btns.push({
            text : "返回上一位置",
            icon : ui_icon.back,
            func : ()=>{
                tp_entity(player,player.back_pos[0],player.back_pos[1],player.back_pos[2],player.back_pos[3],true)
                player.back_pos = ""
            }
        })
    }

    if(config.tp.per && config.tp.per_count > 0){
        ui.btns.push({
            text : "个人传送点",
            icon : ui_icon.player,
            func : ()=>{
                personalPosBar(player,player)
            }
        })
    }

    if(config.tp.world){
        ui.btns.push({
            text : "世界公共点",
            icon : ui_icon.world,
            func : ()=>{
                worldPosBar(player)
            }
        })
    }
    if(config.tp.group){
        ui.btns.push({
            text : "群组公共点",
            icon : ui_icon.group,
            func : ()=>{
                groupPosBar(player)
            }
        })
    }

    if((config.tp.random_range > 0 && now - player.last_tp > config.tp.down*1000) && (player.dimension.id !== "minecraft:the_end" || config.tp.random_end === true)){
        ui.btns.push({
            text : "随机传送",
            icon : ui_icon.compass,
            func : ()=>{
                random_tp(player,now)
            }
        })
    }

    if(is_public_editable(player)){
        ui.btns.push({
            text : "添加固定传送点",
            icon:ui_icon.add,
            func : ()=>{
                public_pos.push({})
                editPosBar(player,public_pos[public_pos.length-1],()=>{
                    save_public_pos()
                },()=>{
                    posBar(player)
                })
            }
        })
    }

    ui.show(player)
}

function get_block(di,lo){
    var block = undefined
    try{
       block = di.getBlock(lo)
    }catch(err){}
    return block
}

function landBar(player , goal){

    var ui = new btnBar()
    ui.title = "领地管理"

    if(un(world.scoreboard.getObjective(config.land.board))){
        confirm(player,"计分板配置错误！领地功能无法使用！")
        return
    }

    var text = ""
    var l = get_land_by_pos(goal.dimension,goal.location)
    if(is_string(l.name)){
        text += `当前领地：${l.name}(id:${l.id})\n`
    }
    
    ui.body = text + `你好${goal.name}\n管理您的领地\n您的领地数量:${goal.lands.length}`
    if(goal.lands.length < config.land.max || get_op_level(goal) > 0){
       ui.btns.push({
            text : "添加领地",
            icon : ui_icon.add,
            func : ()=>{
                player.landing.mode = 1
                tip(player,array2string([
                    "领地设置方法:",
                    "空手选取方块点",
                    "输入+land命令 或 打开主菜单 即可进入创建页面",
                    "创建页面可更改Y轴",
                    "创建页面选择 暂时预览 模式可以继续修改坐标点"
                    
                ]))
            }
        }) 
    }
    
    for(var land_id of goal.lands){
        var land = get_land(land_id)
        if(is_string(land.name)){
            ui.btns.push({
                text : `[${get_di(land.di).name}]${land.name}`,
                op : {
                    id : land.id
                },
                func : (op)=>{
                    viewLandBar(player,goal,op.id)
                }
            })
        }
    }
    
    ui.show(player)
}

function array2line(array){
    var text = ""
    for(var t of array){
        text += t + ","
    }
    text = text.slice(0,text.length-1)
    return text
}

function vector3_to_string(vec){
    return  `(${vec.x.toFixed(1)},${vec.y.toFixed(1)},${vec.z.toFixed(1)})`
}

function editLandPermissionBar(player,goal,land,type){
    land.mem_per = to_array(land.mem_per)
    land.other_per = to_array(land.other_per)

    var ui = new infoBar()
    if(type === 0){
        ui.title = "编辑成员权限"
    }else{
        ui.title = "编辑访客权限"
    }

    for(var per of data_format.land_permission){
        if(type === 0){
            ui.toggle(per,get_text(per),array_has(land.mem_per,per))
        }else{
            ui.toggle(per,get_text(per),array_has(land.other_per,per))
        }
    }

    ui.show(player,(r)=>{
        var result = []
        for(var k in r){
            if(r[k] === true){
                result.push(k)
            }
        }
        if(type === 0){
            land.mem_per = result
        }else{
            land.other_per = result
        }

        save_land(land)
        viewLandBar(player,goal,land.id)
    })
}

function viewLandBar(player,goal,id){
    var land = get_land(id)
    var ui = new btnBar()
    ui.title = "领地"
    ui.body = [
        `领地名:${land.name}`,
        `领地ID:${land.id}`,
        `范围:${vector3_to_string(land.from)} 到 ${vector3_to_string(land.to)}`,
        `领地主人:${get_name_by_id(land.creater)}`,
        `成员:${array2line(land.member)}`,
        `开放队伍:${array2line(land.group)}`
    ]
     if(is_number(land.price)){
        ui.body.push(`价格:${land.price}`)
     }
    if(land_member_level(player,land) >= 3){
    ui.btns.push({
        text : "编辑领地名",
        icon : ui_icon.edit,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.title = "编辑领地名"
            ui2.cancel = ()=>{
                viewLandBar(player,goal,id)
            }
            ui2.input("name","领地名","输入领地名",land.name)
            ui2.show(player,(r)=>{
                land.name = r.name
                save_land(land)
                viewLandBar(player,goal,id)
            })
        }
    })
    
    ui.btns.push({
        text : "编辑欢迎语",
        icon : ui_icon.content,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.title = "编辑欢迎语"
            ui2.cancel = ()=>{
                viewLandBar(player,goal,id)
            }
            ui2.input("wel","欢迎语","输入欢迎语",land.wel)
            ui2.show(player,(r)=>{
                land.wel = r.wel
                save_land(land)
                viewLandBar(player,goal,id)
            })
        }
    })
    
    ui.btns.push({
        text : "编辑开放队伍",
        icon : ui_icon.group,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.title = "编辑开放队伍"
            ui2.cancel = ()=>{
                viewLandBar(player,goal,id)
            }
            ui2.input("group","开放队伍(多个队伍间用英文,间隔)","如:58965,695632,256699",array2line(land.group))
            ui2.show(player,(r)=>{
                var groups = r.group.split(",")
                array_clear(groups,"")
                land.group = groups
                save_land(land)
                viewLandBar(player,goal,id)
            })
        }
    })

    ui.btns.push({
        text : "编辑成员权限",
        func : ()=>{
            editLandPermissionBar(player,goal,land,0)
        }
    },
    {
        text : "编辑访客权限",
        func : ()=>{
            editLandPermissionBar(player,goal,land,1)
        }
    })
    
    ui.btns.push({
        text : "添加成员",
        icon : ui_icon.add,
        func : ()=>{
            var players = []
            for(var p of world.getAllPlayers()){
                if(!array_has(land.member,p.name) && get_id(p) !== land.creater){
                    players.push(p)
                }
            }
            choosePlayer(player,players,(ps)=>{
                for(var p of ps){
                    land.member.push(p.name)
                }
                save_land(land)
                viewLandBar(player,goal,id)
            })
        }
    })
    
    if(land.member.length > 0){
    ui.btns.push({
        text : "移除成员",
        icon : ui_icon.rubbish,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.title = "移除成员"
            ui2.cancel = ()=>{
                viewLandBar(player,goal,id)
            }
            ui2.options("id","移除成员",land.member,0)
            ui2.show(player,(r)=>{
                land.member.splice(r.id,1)
                save_land(land)
                viewLandBar(player,goal,id)
            })
        }
    })
    }
    
    ui.btns.push({
        text : "删除领地",
        icon : ui_icon.delete,
        func : ()=>{
            confirm(player,"确认删除领地？",(r)=>{
                if(r){
                    var index = lands.ids.indexOf(land.id)
                    lands.ids.splice(index,1)
                    lands.min.splice(index,1)
                    lands.max.splice(index,1)
                    array_clear(goal.lands,land.id)
                    save_player_lands(goal)
                    save_lands()
                    landBar(player,goal)
                    
                    var board = world.scoreboard.getObjective(config.land.board)
                    if(!un(board)){
                        if(!un(goal.scoreboardIdentity) && is_number(land.price)){
                            board.addScore(goal,land.price)
                        }
                    }
                }else{
                    viewLandBar(player,goal,id)
                }
            })
        }
    })
    }
    else{
        ui.btns.push({
            text : "关闭",
            icon : ui_icon.delete,
            func : ()=>{}
        })
    }
    ui.show(player)
}

function get_random_tp_range(){
    return random_int(config.tp.random_range*2) - config.tp.random_range
}

function managerStoreGroupsBar(player,type){
    var ui = new btnBar()
    ui.title = "编辑分组"
    ui.text = ["管理分组","注意：分组添加后不能修改，只能删除重新添加"]
    ui.btns = [{
        text : "新增分组",
        icon : ui_icon.add,
        func : ()=> {
            var ui2 = new infoBar()
            ui2.back = ()=>{
                managerStoreGroupsBar(player,type)
            }
            ui2.title = "新增分组"
            ui2.input("name","分组名称","名称","")
            add_pictures_choice(ui2,"选择图标")
            ui2.show(player,(r)=>{
                config.store.groups[r.name] = r.icon
                managerStoreGroupsBar(player,type)
            })
        }
    },{
        text : "删除分组",
        icon : ui_icon.add,
        func : ()=> {
            var groups = {}
            groups = config.store.groups

            var ui2 = new infoBar()
            ui2.back = ()=>{
                managerStoreGroupsBar(player,type)
            }
            ui2.title = "删除分组"
            for(var name of groups){
                ui2.toggle(name,name,false)
            }
            
            ui2.show(player,(r)=>{
                for(var name in r){
                    if(r[name]){
                        delete groups[name]
                    }
                }
                save_config()
                managerStoreGroupsBar(player,type)
            })
        }
    }]

    var groups = []
    groups = config.store.groups
    for(var g in groups){
        ui.btns.push({
            icon : groups[g],
            name : g,
            func : ()=>{
                managerStoreGroupsBar(player,type)
            }
        })
    }

    ui.show(player)
}

function manageStoreBar(player,type = 0){
    var ui = new btnBar()
    ui.title = "管理商店"
    ui.text = "在这里编辑商店"
    ui.btns = [{
        text : "修改商店页面文字",
        icon : ui_icon.edit,
        func : ()=> {
            var texts = []
            if(type === 0){
                texts = to_array(parse_json(get_data("global_store_text")),["商店"])
            }
            var editor = new arrayEditor()
            editor.tran = true
            editor.back = ()=>{
                if(type === 0){
                    save_data("global_store_text",to_json(texts))
                }
                manageStoreBar(player,type)
            }
            editor.edit(player,texts)
        }
    },{
        text : "配置分组",
        icon : ui_icon.group,
        func : ()=> {
            managerStoreGroupsBar(player,type)
        }
    }]

    if(type === 0){
        ui.btns.push({
            text : "配置币种",
            icon : ui_icon.compass,
            func : ()=>{
                var ui2 = new infoBar()
                ui2.back = ()=>{
                    manageStoreBar(player,0)
                }
                ui2.title = "币种"
                ui2.input("moneys","统计货币的计分板，多个计分板直接用英文分号;间隔，币种名即为计分板名称","输入计分板ID",config.store.moneys)
                ui2.show(player,(r)=>{
                    config.store.moneys = r.moneys
                    save_config()
                    manageStoreBar(player,0)
                })
            }
        })
    }

    ui.btns.push({
        text : "商品设置说明",
        icon : ui_icon.info,
        func :  () =>{
            confirm(player,array2string([
                "礼品配置:",
                "1.输入物品ID,会给予玩家该物品",
                "2.输入\"chest.x.y.z\"(x/y/z为坐标,维度主世界,该箱子要在常加载区块),会抽取箱子中的物品,物品的数量即为抽到该物品的权重。若物品不可堆叠,则这个物品的下一个物品不在抽取范围内,下一个物品的数量为这个物品的权重。",
                "3.输入\"score.计分板ID.分数\"可以操作玩家的计分板"
            ]),(r)=>{
                manageStoreBar(player,type)
            })
        }
    },{
        text : "添加商品",
        icon : ui_icon.add,
        func : ()=>{
            editGoodBar(player,type)
        }
    })
}

function get_moneys(){
    var s = config.store.moneys.split(";")
    return s
}

function editGoodBar(player,type,good){
    if(un(good)){
        good = {...data_format.good}
    }

    var groups = ["无"].concat(config.store.groups)
    var moneys = get_moneys()

    var ui = new infoBar()
    ui.title = "编辑商品"
    ui.options("state","状态",["在售","停售"],good.state)
    ui.options("group","分组",groups,array_has(groups,good.group)?groups.indexOf(good.group):0)
    ui.input("title","标题","输入标题",good.title)
    ui.options("type","类型",["售卖手持物品(记录所有特殊值)","收购手持物品(仅记录物品ID)","礼品","快速售卖(不用填名称、描述)"],good.type)
    ui.input("item_id","礼品配置","输入配置代码",good.item_id)
    ui.range("count","单次售卖物品数量/收购最低数量/礼品单物品数量",1,64,1,good.count)
    ui.input("item_name","交易(或物品)名称","输入名称",good.item_name)
    ui.input("description","交易描述","输入描述",good.description)
    ui.options("money","币种",moneys,array_has(moneys,good.money)?groups.indexOf(good.money):0)
    ui.input("price","单次交易价格","价格必须为整数或0",String(good.price))
    ui.input("custom_icon","自定义路径图标","输入路径，如textures/items/totem.png",good.custom_icon)
    add_pictures_choice(ui,"预选图标（预选图标优先级大于自定义图标）",good.icon)
    ui.input("global_count","全图限量","总限量数,0则不限量",String(good.global_count))
    ui.input("personal_count","玩家限量","总限量数,0则不限量",String(good.personal_count))
    ui.options("update_type","刷新方案(不限量不需要填)",["不刷新","隔固定时间刷新","每小时整更新","每天0点更新","每月1日更新"],good.update_type)
    ui.input("update_time","刷新间隔时间/秒(仅选择\"隔固定时间刷新\"才填)","时间/秒",String(good.update_time))
    ui.toggle("hide","售馨(包括个人限量与全图限量)之后隐藏该交易(适用于礼品)",good.hide)
    ui.range("index","优先级(越高显示在越前面,相同时随机排列)",0,100,1,good.index)

    ui.show(player)
}

function globalStoreBar(player){
    var ui = new btnBar()
    ui.title = "商店"
    ui.text = to_array(parse_json(get_data("global_store_text")),["商店"])
    
    if(get_op_level(player) >= 1){
        ui.btns.push({
            text : "管理全局商店",
            icon : ui_icon.setting,
            func : ()=>{
                manageStoreBar(player,0)
            }
        })
    }

    ui.show(player)

}

function cdBar(player){

    if(Date.now() - to_number(player.last_cd) < 1000){
        return
    }else{
        player.last_cd = Date.now()
    }
    
    if(player.landing.mode === 1){
        createLandBar(player)
        return
    }
    
    push_text("cd.name","主菜单")
    push_text("cd.pos","传送系统")
    push_text("cd.kill","自杀")
    push_text("cd.chat","聊天设置")
    push_text("cd.land","领地")
    push_text("cd.group","群组")
    push_text("cd.board","公告")

    var ui = new btnBar()
    ui.title = get_text("cd.name")
    ui.body = tran_text(player,to_array(parse_json(get_data("menu_text")),data_format.menu),true)
    ui.busy = null


    if(player.in_land !== ""){
        var land = get_land(player.in_land)
        ui.btns.push({
            text : `领地:${land.name}\n领地主:${get_name_by_id(land.creater)}`,
            icon : ui_icon.land,
            func : ()=>{
                viewLandBar(player,player,land.id)
            }
        })
    }
    
    ui.btns.push({
        text : get_text("cd.pos"),
        icon : ui_icon.pos,
        func :()=>{
            posBar(player)
        }
    })
    ui.btns.push({
        text : get_text("cd.chat"),
        icon : ui_icon.chat,
        func :()=>{
            setChatBar(player)
        }
    })
    if(config.land.able){
        ui.btns.push({
            text : get_text("cd.land"),
            icon : ui_icon.land,
            func :()=>{
                landBar(player,player)
            }
        })
    }
    if(config.groups.able){
        ui.btns.push({
            text : get_text("cd.group"),
            icon : ui_icon.player,
            func :()=>{
                groupsBar(player)
            }
        })
    }

    if(config.store.able){
        ui.btns.push({
            text : "商店",
            icon : ui_icon.trade,
            func :()=>{
                globalStoreBar(player)
            }
        })
    }

    if(config.tran.able){
        ui.btns.push({
            text : "转账机",
            icon : ui_icon.trade,
            func :()=>{
                tranBar(player)
            }
        })
    }
    if(config.game.kill){
        ui.btns.push({
            text : get_text("cd.kill"),
            icon : ui_icon.sword,
            func :()=>{
                player.kill()
            }
        })
    }
    
    if(get_board_ids().length > 0 && config.board.able){
    ui.btns.push({
        text : get_text("cd.board"),
        icon : ui_icon.sign,
        func :()=>{
            show_board(player)
        }
    })
    }
    
    if(get_op_level(player) >= 1){
        ui.btns.push({
            text : "管理界面",
            icon : ui_icon.op,
            func :()=>{
                opBar(player)
            }
        })
    }
    ui.show(player)
}

function usfTickCheck(player){
    chat("正在进行时长为5s的性能检测...",[player])
    var start_tick = system.currentTick
    system.runTimeout(()=>{
        var fps = ((system.currentTick - start_tick)/5).toFixed(2)
        
        var fps_text = "极其卡顿"
        if(fps > 10){fps_text = "卡顿"}
        if(fps > 14){fps_text = "不足"}
        if(fps > 16){fps_text = "正常"}
        if(fps > 18){fps_text = "优"}
        
        var ui = new btnBar()
        ui.title = "插件性能检查"
        ui.body = [
            "检测用时:5s",
            `平均FPS:${fps}(${fps_text})`,
            `配置文件占用:${get_string_length(to_json(config))}/32767`
        ]
        ui.btns = [{
            text : "管理界面",
            icon:ui_icon.op,
            func :()=>{
                opBar(player)
            }
        }]
        ui.show(player)
    },100)
}

function banListCheck(player){
    var ui = new btnBar()
    ui.title = "封禁列表管理"
    ui.body = ["管理封禁列表",
    "注：玩家名与玩家id皆有效",
    "封禁列表:"]

    var list = get_ban_list()
    for(var id of list){
        ui.body.push(`${get_name_by_id(id)}(${id})`)
    }

    ui.btns = [{
        text : "添加并立即踢出玩家",
        icon : ui_icon.add,
        func : ()=>{
            choosePlayer(player,world.getAllPlayers(),(ps)=>{
                for(var p of ps){
                    list.push(String(get_id(p)))
                    kick(p,"你已被封禁！")
               }
               save_data("ban",to_json(list))
               banListCheck(player)
            })
        }
    }]

    if(list.length > 0){
        ui.btns.push({
            text : "移除玩家",
            icon : ui_icon.delete,
            func : ()=>{
                var ui = new infoBar()
                ui.title = "移除玩家"
                for(var id of list){
                    ui.toggle(id,`${get_name_by_id(id)}(${id})`,false)
                }
                ui.show(player,(r)=>{
                    for(var k of Object.keys(r)){
                        if(r[k] === true){
                            array_clear(list,k)
                        }
                    }
                    save_data("ban",to_json(list))
                    banListCheck(player)
                })   
            }
        })
    }

    ui.btns.push({
        text : "编辑列表",
        icon : ui_icon.edit,
        func :()=>{
            var editor =new arrayEditor()
            editor.back =()=>{
                save_data("ban",to_json(list))
                banListCheck(player)
            }
            editor.edit(player,list)
        }
    })

    ui.show(player)
}

function get_left_time(p){
    return Math.round(p.info.ban_time - Date.now())
}

function stopPlayerBar(player){
    var ps = world.getAllPlayers()
    var texts = []
    var ui = new infoBar()
    ui.title = "屏蔽/禁言玩家"
    for(var i=0;i<ps.length;i++){
        var p = ps[i]
        
        var text = p.name
        if(p.info.ban_time > Date.now()){
            text += `(禁言中，剩余${Math.round(get_left_time(p)/1000)}s)`
        }
        if(p.info.block){
            text += "(屏蔽中)"
        }
        texts.push(text)
    }

    ui.options("id","选择玩家",texts,0)
    ui.input("left","禁言时间/s(设为0则取消禁言)","输入时间","0")
    ui.toggle("block","屏蔽(此玩家不会收到公共消息)",false)

    ui.show(player,(r)=>{
        var p = ps[r.id]
        r.left = to_number(parseInt(r.left),0)
        p.info.ban_time = Date.now() + r.left*1000
        p.info.block = r.block
        save_player_info(p)
        opBar(player)
    })

}

function tagSetBar(player){
    var ps = world.getAllPlayers()
    var names = []
    for(var p of ps){
        names.push(`${p.name}(${get_chat_tag(p)})`)
    }

    var ui =new infoBar()
    ui.title = "头衔设置"
    ui.options("id","选择玩家",names,0)
    ui.input("tag","你可以通过§e/tag 玩家 add usf.tag:头衔§r来设置玩家头衔\n以及§e/tag 玩家 add usf.tag:Reset§r来重置玩家头衔\n头衔","输入头衔","")
    ui.show(player,(r)=>{
        var p = ps[r.id]
        set_chat_tag(p,r.tag) 
        opBar(player)
    })
}

function two_find_min(array , count){
    var goal = -1
    var from = 0
    var to = array.length-1
    while(from <= to){
        var mid = Math.floor((from + to)/2)
        if(array[mid] <= count && mid > goal){
            goal = mid
        }
        if(array[mid] < count){
            from = mid + 1
        }else{
            to = mid - 1
        }
    }
    return goal
}

function find_min_in_lands(dis){
    return two_find_min(lands.min,dis)
}

function save_lands(){
    save_data("lands_ids",to_json(lands.ids))
    save_data("lands_min",to_json(lands.min))
    save_data("lands_max",to_json(lands.max))
}

function add_land(player,land){
    var index = find_min_in_lands(Math.max(land.distance - 65,0))
    if(index === -1){
        lands.ids.unshift(land.id)
        lands.min.unshift(Math.max(land.distance - 65,0))
        lands.max.unshift(land.distance + 65)
    }else{
        lands.ids.splice(index+1,0,land.id)
        lands.min.splice(index+1,0,Math.max(land.distance - 65,0))
        lands.max.splice(index+1,0,land.distance + 65)
    }
    save_lands()
    player.lands.push(land.id)
    save_player_lands(player)
}

function save_land(land){
    save_data(`land.${land.id}`,to_json(land))
}

function is_land_in_other(di,lo1,lo2){
    var center = {
        x : (lo1.location.x + lo2.location.x)/2,
        y : (lo1.location.y + lo2.location.y)/2,
        z : (lo1.location.z + lo2.location.z)/2
    }
    var dis = Math.round(Math.sqrt(Math.pow(Math.abs(center.x),2) + Math.pow(Math.abs(center.z),2)))
    var i = two_find_min(lands.min,dis)
    if(i === -1){
        return true
    }
    for(i >= 0 ;i--;){
        if(lands.max[i] < dis){
            return true
        }
        var land = get_land(lands.ids[i])
        if(is_string(land.name)){
            if(land.di === di.id){
            if(
               ((lo1.x < land.from.x && lo2.x < land.from.x && lo1.x < land.to.x && lo2.x < land.to.x) || (lo1.x > land.from.x && lo2.x > land.from.x && lo1.x > land.to.x && lo2.x > land.to.x))
               ||
               ((lo1.y < land.from.y && lo2.y < land.from.y && lo1.y < land.to.y && lo2.y < land.to.y) || (lo1.y > land.from.y && lo2.y > land.from.y && lo1.y > land.to.y && lo2.y > land.to.y))
               ||
               ((lo1.z < land.from.z && lo2.z < land.from.z && lo1.z < land.to.z && lo2.z < land.to.z) || (lo1.z > land.from.z && lo2.z > land.from.z && lo1.z > land.to.z && lo2.z > land.to.z))
             ){
            }else{
                return false
            }
            }
        }
    }
    return true
}

function createLandBar(player){
    
    var ui = new infoBar()
    ui.busy = null
    var points = player.landing.points
    
    if(!is_land_in_other(player.dimension,points[0],points[1])){
        show_title(player,"领地重叠！无法创建！")
        return
    }
    
    
    var size = {
        x : Math.abs(points[0].location.x - points[1].location.x) + 1,
        y : Math.abs(points[0].location.y - points[1].location.y) + 1,
        z : Math.abs(points[0].location.z - points[1].location.z) + 1,
    }

    if(size.x > 126.5 || size.z > 126.5){
        show_title(player,"范围过大！无法创建！\n上限:126*126")
        return
    }
    
    var board = world.scoreboard.getObjective(config.land.board)
    var price = Math.round(size.x*size.y*size.z*config.land.price)
    if(to_number(board.getScore(player)) - price < 0 && config.land.must){
        show_title(player,"金额不足！无法创建！")
        return
    }
    
    if(un(player.scoreboardIdentity)){
        show_title(player,"无法初始化计分板\n请重进游戏")
        return
    }
    
    ui.title = "新建领地"
    ui.input("name",`领地尺寸:${size.x} * ${size.y} * ${size.z}\n您的金额:${to_number(board.getScore(player))}\n价格:${price}\n总方块量:${size.x*size.y*size.z}\n始点:${get_block_pos(points[0])}\n终点:${get_block_pos(points[1])}\n领地名:`,"领地名","")
    ui.range("y1","起点y坐标(修改后请选择预览)",player.dimension.heightRange.min,player.dimension.heightRange.max,1,points[0].y)
    ui.range("y2","终点y坐标(修改后请选择预览)",player.dimension.heightRange.min,player.dimension.heightRange.max,1,points[1].y)
    ui.options("type","操作",["暂时预览","取消创建","确认创建"],0)
    ui.show(player,(r)=>{
        if(r.type === 0){
            try{
                var b = player.dimension.getBlock({x:points[0].location.x,y:r.y1,z:points[0].location.z})
                if(!un(b)){
                    points[0] = {location : b.location,x:b.x,y:b.y,z:b.z}
                }
                
                b = player.dimension.getBlock({x:points[1].location.x,y:r.y2,z:points[1].location.z})
                if(!un(b)){
                    points[1] = {location : b.location,x:b.x,y:b.y,z:b.z}
                }
            }catch(err){}
            return
        }
        if(r.type === 1){
            player.landing.mode = 0
            player.landing.points = []
            return
        }
        
        var ps = get_edge_from_block(points[0].location,points[1].location)
        points[0] = ps[0]
        points[1] = ps[1]
        var land = {
            "id" : get_di_num(player.dimension) + String(get_random_land_id()),
            "di" : player.dimension.id,
            "from" : points[0],
            "to" : points[1],
            "creater": get_id(player),
            "group" : [],
            "member" : [],
            "wel":"",
            "name" : r.name,
            "price" : price,
        }
        var center = {
            x : (points[1].x + points[0].x)/2,
            z : (points[1].z + points[0].z)/2
        }
        board.setScore(player,to_number(board.getScore(player)) - price)
        land.distance = Math.round(Math.sqrt(Math.pow(Math.abs(center.x),2) + Math.pow(Math.abs(center.z),2)))
        add_land(player,land)
        save_land(land)
        player.landing.mode = 0
        player.landing.points = []
    })
}

function small_to_big(c1 , c2){
    if(c1 < c2){
        return [c1,c2]
    }
    return [c2,c1]
}

function get_edge_from_block(start , end){
    var tallest = small_to_big(start.y,end.y)[1]+1
    var shortest = small_to_big(start.y,end.y)[0]
    var new_start = {
        x:small_to_big(start.x,end.x)[0],
        y:tallest,
        z:small_to_big(start.z,end.z)[0]
    }
    var new_end = {
        x:small_to_big(start.x,end.x)[1]+1,
        y:shortest,
        z:small_to_big(start.z,end.z)[1]+1
    }
    return [new_start,new_end]
}

function show_range(start , end , di , co = {red:0.0,green:1.0,blue:1.0,alpha:1.0}){
    var molang = new mc.MolangVariableMap()
    molang.setColorRGB("variable.color",co)
    molang.setVector3("variable.direction",{x:0,y:0,z:0})
    
    var tallest = small_to_big(start.y,end.y)[1]+1
    var shortest = small_to_big(start.y,end.y)[0]
    var new_start = get_edge_from_block(start , end)[0]
    var new_end = get_edge_from_block(start , end)[1]
    try{
    for(var cf=small_to_big(new_start.x,new_end.x)[0];cf <= small_to_big(new_start.x,new_end.x)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:cf,y:shortest,z:new_start.z},molang)
    }
    for(var cf=small_to_big(new_start.x,new_end.x)[0];cf <= small_to_big(new_start.x,new_end.x)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:cf,y:shortest,z:new_end.z},molang)
    }
    for(var cf=small_to_big(new_start.z,new_end.z)[0];cf <= small_to_big(new_start.z,new_end.z)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_start.x,y:shortest,z:cf},molang)
    }
    for(var cf=small_to_big(new_start.z,new_end.z)[0];cf <= small_to_big(new_start.z,new_end.z)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_end.x,y:shortest,z:cf},molang)
    }
    for(var cf=small_to_big(new_start.x,new_end.x)[0];cf <= small_to_big(new_start.x,new_end.x)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:cf,y:tallest,z:new_start.z},molang)
    }
    for(var cf=small_to_big(new_start.x,new_end.x)[0];cf <= small_to_big(new_start.x,new_end.x)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:cf,y:tallest,z:new_end.z},molang)
    }
    for(var cf=small_to_big(new_start.z,new_end.z)[0];cf <= small_to_big(new_start.z,new_end.z)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_start.x,y:tallest,z:cf},molang)
    }
    for(var cf=small_to_big(new_start.z,new_end.z)[0];cf <= small_to_big(new_start.z,new_end.z)[1];cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_end.x,y:tallest,z:cf},molang)
    }
    for(var cf=shortest;cf <= tallest;cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_start.x,y:cf,z:new_start.z},molang)
    }
    for(var cf=shortest;cf <= tallest;cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_end.x,y:cf,z:new_start.z},molang)
    }
    for(var cf=shortest;cf <= tallest;cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_start.x,y:cf,z:new_end.z},molang)
    }
    for(var cf=shortest;cf <= tallest;cf ++){
        di.spawnParticle("minecraft:wax_particle",{x:new_end.x,y:cf,z:new_end.z},molang)
    }
    }catch(err){}
}


function getPlayerItemsBar(player){
    var block = player.dimension.getBlock(player.location)
    var p_com = player.getComponent("minecraft:inventory").container
    var items = []
    if(!block.isAir){
        tip(player,"您所在的位置不是空气方块，无法执行背包检查功能！",()=>{
            opBar(player)
        })
        return
    }
    else{
        choosePlayer(player,world.getAllPlayers(),(ps)=>{
            for(var p of ps){
                var com = p.getComponent("minecraft:inventory").container
                block.setType("minecraft:undyed_shulker_box")
                var b_com = block.getComponent("minecraft:inventory").container
                b_com.clearAll()

                for(var i=9;i<com.size;i++){
                    b_com.setItem(i-9,com.getItem(i))
                }
                items.push(block.getItemStack(1,true))
                b_com.clearAll()

                for(var i=0;i<9;i++){
                    b_com.setItem(i,com.getItem(i))
                }
                com = p.getComponent("minecraft:equippable")
                b_com.setItem(9,com.getEquipment("Head"))
                b_com.setItem(10,com.getEquipment("Chest"))
                b_com.setItem(11,com.getEquipment("Legs"))
                b_com.setItem(12,com.getEquipment("Feet"))

                b_com.setItem(18,com.getEquipment("Offhand"))
                items.push(block.getItemStack(1,true))

                b_com.clearAll()
                for(var item of items){
                    b_com.addItem(item)
                }
                var goal = block.getItemStack(1,true)
                goal.nameTag = `玩家背包:${p.name}`
                p_com.addItem(goal)
                block.setType("minecraft:air")
            }
        })
    }
}

function reset_player_follow(player){
    delete player.follow
    player.camera.fade({
        fadeColor : {blue:0,green:0,red:0},
        fadeTime : {
            fadeInTime : 0.4,
            fadeOutTime : 0.4,
            holdTime : 0.2
        }
    })
    system.runTimeout(()=>{
        player.camera.clear()
    },8)
    if(is_object(player.info.follow)){
        var follow = player.info.follow
        tp_entity(player,get_di(follow.di),follow.x,follow.y,follow.z)
        set_mode(player,player.info.follow.mode)
        delete player.info.follow
        save_player_info(player)
    }
}

function followBar(player){
    var text = get_text("follow.tip")
    var ui = new infoBar()
    var players = world.getAllPlayers()
    var names = []
    for(var i=0;i<players.length;i++){
        names.push(players[i].name)
    }
    ui.title = "跟踪视角"
    ui.options("index",text + "\n选择玩家",names,0)
    ui.options("mode","选择跟踪模式",["第一视角","自由视角"],0)
    ui.show(player,(r)=>{
        player.camera.fade({
            fadeColor : {blue:0,green:0,red:0},
            fadeTime : {
                fadeInTime : 0.4,
                fadeOutTime : 0.4,
                holdTime : 0.2
            }
        })
        system.runTimeout(()=>{
            var lo = players[r.index].location
            if(r.mode === 0){
                tp_entity(player,players[r.index].dimension,lo.x,-10000,lo.z,false)
            }else{
                tp_entity(player,players[r.index].dimension,lo.x,-10000+lo.y,lo.z,false)
            }
            
            player.follow = {
                type:r.mode,
                player : players[r.index],
                pos : player.location
            }

            player.info.follow = {
                di : player.dimension.id,
                x:player.location.x,
                y:player.location.y,
                z:player.location.z,
                mode : get_mode(player)
            }
            save_player_info(player)

            set_mode(player,3)

            lo.y += 2
            player.camera.setCamera("usf:example_player_effects",{
                location : lo,
                easeOptions : {
                    easeType : "Linear",
                    easeTime : 0.1
                }
            })
        },8)
    })
}

function reportBar(player){
    var ui = new btnBar()
    ui.title = "管理员日志"
    ui.body = get_reports()
    ui.btns = [{
        text : "添加一行日志",
        func : ()=>{
            var ui2 = new infoBar()
            ui2.cancel = ()=>{
                reportBar(player)
            }
            ui2.input("text","日志内容","请输入日志","")
            ui2.show(player,(r)=>{
                report_warn("text",{
                    text : r.text
                })
                reportBar(player)
            })
        }
    },{
        text : "清理日志",
        func : ()=>{
            save_data("reports","")
            reportBar(player)
        }
    }]
    ui.show(player)
}

function lockRulesBar(player){
    var ui = new infoBar()
    ui.title = "规则锁定"
    var text = ""
    if(to_bool(config.rule.able)){
        var rules = to_object(parse_json(config.rule.data))
        for(var k in rules){
            text += `${get_text(k)} : ${rules[k] === true ? "开" : "关"}\n`
        }
    }
    ui.toggle("able",text + "\n启用规则锁定",to_bool(config.rule.able))
    ui.cancel = ()=> {
        opBar(player)
    }
    ui.show(player,(r)=>{
        config.rule.able = r.able
        if(r.able){
            config.rule.data = to_json({
                "mobGriefing" : world.gameRules.mobGriefing,
                "keepInventory" : world.gameRules.keepInventory,
                "tntExplodes" : world.gameRules.tntExplodes,
                "showCoordinates" :world.gameRules.showCoordinates,
                "pvp" :world.gameRules.pvp,
                "doMobSpawning" :world.gameRules.doMobSpawning,
                "doImmediateRespawn" :world.gameRules.doImmediateRespawn,
                "commandBlocksEnabled" :world.gameRules.commandBlocksEnabled,
            })
        }
        save_config()
        opBar(player)
    })
}

function opBar(player){
    if(is_object(player.follow)){
        reset_player_follow(player)
    }
    if(get_op_level(player) === 0){
        return
    }
    var ui = new btnBar()
    ui.busy = null
    ui.title = "管理界面"
    ui.body = "欢迎来到管理界面"
    ui.btns = [
        {
            text : "锁定游戏规则",
            icon : ui_icon.lock,
            func : ()=>{
                lockRulesBar(player)
            }
        },
        {
            text : "聊天消息过滤词",
            func : ()=>{
                confirm(player,[
                    "提醒：每行输入一个白名单词，若聊天信息中包含任意一个词，usf将不处理此消息，例如兼容其他模组的指令系统",
                    "点击下方确认按钮前往编辑"],(r)=>{
                        if(r){
                            var editor = new arrayEditor()
                            editor.back = ()=>{
                                save_data("white_words",to_json(white_words))
                                opBar(player)
                            }
                            editor.edit(player,white_words)
                        }else{
                            opBar(player)
                        }
                    })
            },
            icon : ui_icon.water
        },
        {
        text : "封禁实体",
        icon : ui_icon.rubbish,
        func : ()=>{
            confirm(player,[
                "提醒：每行输入一个实体id(要加minecraft前缀)",
                "点击下方确认按钮前往编辑"],(r)=>{
                    if(r){
                        var editor = new arrayEditor()
                        editor.back = ()=>{
                            save_config()
                            
                            var unable = []
                            for(var id of config.ban_entity){
                                if(un(mc.EntityTypes.get(id))){
                                    unable.push(id)
                                }
                            }
                            
                            if(unable.length > 0){
                            var text = "编辑已完成，但以下ID可能无效\n" + array2string(unable)
                            tip(player,text,()=>{
                                opBar(player)
                            })
                            }else{
                                opBar(player)
                            }
                            
                        }
                        editor.edit(player,config.ban_entity)
                    }else{
                        opBar(player)
                    }
                })
        }
    },{
        text : "封禁掉落物",
        icon : ui_icon.rubbish,
        func : ()=>{
            confirm(player,[
                "提醒：每行输入一个物品id(要加minecraft前缀)",
                "点击下方确认按钮前往编辑"],(r)=>{
                    if(r){
                        var editor = new arrayEditor()
                        editor.back = ()=>{
                            save_config()
                            
                            var unable = []
                            for(var id of config.ban_item){
                                if(un(mc.ItemTypes.get(id))){
                                    unable.push(id)
                                }
                            }
                            
                            if(unable.length > 0){
                            var text = "编辑已完成，但以下ID可能无效\n" + array2string(unable)
                            tip(player,text,()=>{
                                opBar(player)
                            })
                            }else{
                                opBar(player)
                            }
                            
                        }
                        editor.edit(player,config.ban_item)
                    }else{
                        opBar(player)
                    }
                })
        }
    },{
        text : "性能检测",
        icon : ui_icon.info,
        func : ()=>{
            usfTickCheck(player)
        }
    },{
        text : "管理模式 - " + ((player.info.manager === true)? "开" : "关" + "\n可破坏领地、在领地界面做修改"),
        icon : ui_icon.manager,
        func : ()=>{
            if(player.info.manager === false || un(player.info.manager)){
                player.info.manager = true
                save_player_info(player)
            }else{
                player.info.manager = false
                save_player_info(player)
            }
        }
    },{
        text : "管理玩家领地",
        icon : ui_icon.land,
        func : ()=>{
            choosePlayer(player,world.getAllPlayers(),(ps)=>{
                if(ps.length >= 1){
                    landBar(player,ps[0])
                }else{
                    opBar(player)
                }
            })
        }
    },{
        text : "删除领地",
        icon : ui_icon.land,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.cancel = ()=>{
                opBar(player)
            }
            ui2.title = "删除领地"
            ui2.input("id","输入领地ID","输入7位ID","")
            ui2.show(player,(r)=>{
                var index = lands.ids.indexOf(r.id)
                if(index === -1){
                    tip(player,"找不到此领地！",()=>{
                        opBar(player)
                    })
                }else{
                    lands.ids.splice(index,1)
                    lands.min.splice(index,1)
                    lands.max.splice(index,1)
                    save_lands()
                    tip(player,"已删除此领地！",()=>{
                        opBar(player)
                    })
                }
            })
        }
    },{
        text : "视角跟踪",
        icon : ui_icon.eye,
        func : ()=>{
            followBar(player)
        }
    },{
        text : "屏蔽/禁言玩家",
        icon : ui_icon.mute,
        func : ()=>{
            stopPlayerBar(player)
        }
    },{
        text : "获取背包",
        icon : pictures.chest,
        func : ()=>{
            getPlayerItemsBar(player)
        }
    },{
        text : "封禁列表管理",
        icon : ui_icon.stop,
        func : ()=>{
            banListCheck(player)
        }
    },
    {
        text : "头衔设置",
        icon : ui_icon.star,
        func : ()=>{
            tagSetBar(player)
        }
    },
    {
        text : "查看所有群组",
        icon : ui_icon.group,
        func : ()=>{
            var text = []
            
            for(var id of groups){
                var g = get_group(id)
                if(is_group(g)){
                    text.push(`群名:${g.name}\n群ID:${g.id}\n群主:${get_name_by_id(g.creater)}\n群成员:`)
                    for(var m of g.member){
                        text.push(get_name_by_id(m))
                    }
                    text.push("————————————")
                }
            }
            var ui = new btnBar()
            ui.title = "所有群组"
            ui.body = "此处管理所有群组，点击进入管理员编辑模式"
            ui.btns = [{
                text : "返回",
                icon: ui_icon.back,
                func : ()=>{
                    opBar(player)
                }
            }]
            for(var id of groups){
                var g = get_group(id)
                if(is_group(g)){
                    ui.btns.push({
                        text : `${g.name}(${g.id})\n群主:${get_name_by_id(g.creater)}`,
                        op : {i : id},
                        func : (op) => {
                            groupLookBar(player,get_group(op.i),true)
                        }
                    })
                }
            }
            ui.show(player)
        }
    },{
        text : "管理日志",
        icon : ui_icon.share,
        func : ()=>{
            reportBar(player)
        }
    },{
        text : "调试输出js全局变量",
        icon : ui_icon.random,
        func : ()=>{
            chat("config:" + to_json(config),[player])
            chat("IDs:" + to_json(ids),[player])
            chat("Names:" + to_json(id_names),[player])
        }
    },{
        text : "管理悬浮字",
        icon : ui_icon.brush,
        func : ()=>{
            managerFloat(player)
        }
    },{
        text : "插件设置",
        icon : ui_icon.setting,
        func : ()=>{
            usfSettingBar(player)
        }
    }]

    ui.btns.push({
        text : "op管理",
        icon : ui_icon.op,
        func : ()=>{
            setOpBar(player)
        }
    })
    ui.show(player)
}

function managerFloat(player){
    var ui = new btnBar()
    ui.title = "管理悬浮字"
    ui.body = [
        "管理32格内的悬浮字",
        "悬浮字本质是蝙蝠，为防止误杀悬浮字，kill悬浮字后会重新生成",
        "你可以去除悬浮字的Float标签，这样悬浮字即可被kill",
        "例如§e/tag @e[type=bat] remove Float§r命令可以使所有悬浮字都能被kill"]
    
    var op = {
        location : player.location,
        maxDistance : 32,
        type : "bat",
        tags : ["Float"]
    }
    for(var bat of player.dimension.getEntities(op)){
        ui.btns.push({
            text : `${get_data("name",bat)}`,
            op : {
                bat : bat
            },
            func : (op)=>{
                editFloat(player,op.bat)
            }
        })
    }
    
    ui.btns.push({
        text : "添加悬浮字",
        icon : ui_icon.add,
        func : ()=>{
            var bat = player.dimension.spawnEntity("minecraft:bat<usf:text>",player.location)
            editFloat(player,bat)
        }
    })
    ui.show(player)
}

function editFloat(player,bat){
    var text = get_data("text",bat)
    var name = get_data("name",bat)
    

    var ui = new infoBar()
    ui.title = "编辑悬浮字"
    ui.cancel = ()=>{
        bat.remove()
        managerFloat(player)
    }
    ui.busy = ()=>{
        bat.remove()
    }
    ui.input("name","悬浮字备注(用于管理)","输入备注",name)
    ui.input("text",get_text("tran_text_") + "\n内容","输入内容",text)
    ui.input("x","X坐标","输入坐标",String(bat.location.x.toFixed(2)))
    ui.input("y","Y坐标","输入坐标",String(bat.location.y.toFixed(2)))
    ui.input("z","Z坐标","输入坐标",String(bat.location.z.toFixed(2)))
    ui.toggle("de","删除",false)
    ui.show(player,(r)=>{
        if(r.de){bat.remove()}
        else{
            var lo = {di : bat.dimension.id}
            lo.x = to_number(parseFloat(r.x),bat.location.x)
            lo.y = to_number(parseFloat(r.y),bat.location.y)
            lo.z = to_number(parseFloat(r.z),bat.location.z)
            
            save_data("lo",to_json(lo),bat)
            save_data("name",r.name,bat)
            save_data("text",r.text,bat)
            if(!bat.hasTag("Float")){
                bat.addTag("Float")
            }
        }
        managerFloat(player)
    })
}

function tip(player , text = "" , back = function(){}){
    var ui = new btnBar()
    ui.title = "提示"
    ui.body = text
    if(is_function(back)){
        ui.cancel = back
        ui.btns.push({
            text : "返回",
            icon : ui_icon.back,
            func : ()=>{
                back()
            }
        })
    }
    ui.btns.push({
        text : "关闭",
        icon : ui_icon.delete,
        func : ()=>{
            
        }
    })
    ui.show(player)
}

function debug(player,com){
    for(var id in global){
        chat(id)
    }
    console.error(to_json(globalThis[com]),[player])
}

function setOpBar(player){
    if(get_op_level(player) === 0){
        return
    }
    var ui = new btnBar()
    ui.title = "OP管理"
    ui.cancel = ()=>{
        opBar(player)
    }

    var text = "服务器OP:\n"
    for(var id of ops){
        text += `${id}(${get_name_by_id(id)})` + "\n"
    }
    text += "服务器owners:\n"
    for(var o of get_owners()){
        text += `${o}(${get_name_by_id(o)})` + "\n"
    }
    ui.body = text
    ui.btns.push({
        text : "添加op",
        icon : ui_icon.add,
        func : ()=>{
            var names = []
            var ps = []
            for(var p of world.getAllPlayers()){
                if(get_op_level(p) === 0){
                    names.push(p.name)
                    ps.push(p)
                }
            }
            if(ps.length === 0){
                tip(player,"当前没有可添加的玩家！",()=>{
                    setOpBar(player)
                })
                return
            }

            var ui = new infoBar()
            ui.cancel = ()=>{
                setOpBar(player)
            }
            ui.title = "添加op"
            ui.options("id","选择玩家",names,0)
            ui.show(player,(r)=>{
                ops.push(get_id(ps[r.id]))
                save_ops()
                setOpBar(player)
            })
        }
    })
    if(ops.length > 0){
        ui.btns.push({
            text : "删除op",
            icon : ui_icon.delete,
            func :()=>{
                var names = []
                for(var id of ops){
                    names.push(String(id) + `(${get_name_by_id(id)})`)
                }

                var ui = new infoBar()
                ui.cancel = ()=>{
                    setOpBar(player)
                }
                ui.title = "删除op"
                ui.options("id","选择玩家",names,0)
                ui.show(player,(r)=>{
                    ops.splice(r.id,1)
                    save_ops()
                    setOpBar(player)
                })
            }
        })
    }

    if(get_owners().length > 0){
        ui.btns.push({
            text : "删除owner",
            icon : ui_icon.delete,
            func :()=>{
                var owners = get_owners()
                var names = []
                for(var i=0;i<owners.length;i++){
                    names.push(owners[i]+"("+get_name_by_id(owners[i])+")")
                }
                chooseBar(player,names,(r)=>{
                    var ids = []
                    for(var i of r){
                        ids.push(owners[i])
                    }
                    for(var i of ids){
                        owners.splice(owners.indexOf(i),1)
                    }
                    save_data("owners",to_json(owners))
                    setOpBar(player)
                })
            }
        })
    }



    if(get_op_level(player) === 1){
        ui.btns = [{
            text : "关闭",
            icon : ui_icon.delete,
            func : ()=>{

            }
        }]
    }
    ui.show(player)
}

function save_ops(){
    save_data("op" , to_json(ops))
}

function OnlineBoardBar(player){
    var ui = new infoBar()
    ui.title = "剔除离线玩家计分板"
    var text = `输入要剔除离线玩家的计分板ID，多个计分板之间用英文分号;间隔开\n设置后,系统会生成一个下划线_后缀的计分板，这个计分板就是剔除离线玩家的计分板\n例如： Money >> Money_`
    ui.input("r",text,"计分板id,多个之间用;隔开",config.copy_boards)
    ui.show(player,(r)=>{
        config.copy_boards = r.r
        save_config()
    })
}

function usfSettingBar(player){
    var ui = new btnBar()
    ui.title = "插件设置"
    ui.body = 
    ["欢迎来到插件设置界面",
     "此处管理插件所有功能"]
    ui.btns = [{
        text : "计分板自动剔除离线玩家设置",
        icon : ui_icon.ping,
        func : ()=>{
            OnlineBoardBar(player)
        }
    },{
        text : "转账鸡设置",
        icon : ui_icon.trade,
        func : ()=>{
            usfFunctionBar(player,"tran")
        }
    },
    
    /* {
        text : "全局商店设置",
        icon : ui_icon.trade,
        func : ()=>{
            usfFunctionBar(player,"store")
        }
    }, */
    
    {
        text : "公告设置",
        icon : ui_icon.sign,
        func : ()=>{
            usfBoardBar(player)
        }
    },{
        text : "伤害血量显示",
        icon : ui_icon.heart,
        func : ()=>{
            usfFunctionBar(player,"hurttip")
        }
    },{
        text : "计分板默认值",
        icon : ui_icon.scoreboard,
        func : ()=>{
            usfFunctionBar(player,"reset")
        }
    },{
        text : "群组设置",
        icon : ui_icon.group,
        func : ()=>{
            usfFunctionBar(player,"group")
        }
    },{
        text : "日志功能设置",
        icon : ui_icon.content,
        func : ()=>{
            usfFunctionBar(player,"log")
        }
    },{
        text : "积分统计",
        icon : ui_icon.online,
        func : ()=>{
            usfFunctionBar(player,"score")
        }
    },{
        text : "领地功能设置",
        icon : ui_icon.land,
        func : ()=>{
            usfFunctionBar(player,"land")
        }
    },{
        text : "游戏时间统计",
        icon : ui_icon.clock,
        func : ()=>{
            usfFunctionBar(player,"time")
        }
    },{
        text : "锁定物品设置",
        icon : ui_icon.slot,
        func : ()=>{
            setLockBar(player)
        }
    },{
        text : "进服欢迎提示设置",
        icon : ui_icon.tip,
        func : ()=>{
            usfFunctionBar(player,"tip")
        }
    },{
        text : "聊天信息格式",
        icon : ui_icon.chat,
        func : ()=>{
            usfFunctionBar(player,"chat")
        }
    },{
        text : "玩家名格式",
        icon : ui_icon.player,
        func : ()=>{
            usfFunctionBar(player,"name")
        }
    },{
        text : "反作弊设置",
        icon : ui_icon.stop,
        func : ()=>{
            usfFunctionBar(player,"hacker")
        }
    },{
        text : "插件命令设置",
        icon : ui_icon.command,
        func : ()=>{
            usfFunctionBar(player,"com")
        }
    },
    {
        text : "打开主菜单物品",
        icon : ui_icon.big,
        func : ()=>{
           usfFunctionBar(player,"cd_items")
        }
    },{
        text : "编辑主菜单文字",
        icon : ui_icon.edit,
        func : ()=>{
            usfFunctionBar(player,"cd_con")
        }
    },
    {
        text : "传送点设置",
        icon : ui_icon.pos,
        func : ()=>{
            usfFunctionBar(player,"pos")
        }
    },{
        text : "在线玩家计分板设置",
        icon : ui_icon.off,
        func : ()=>{
            usfFunctionBar(player,"online")
        }
    },
    {
        text : "游戏辅助功能",
        icon : pictures.tnt,
        func : ()=>{
            usfFunctionBar(player,"game")
        }
    },
    {
        text : "语言设置",
        icon : pictures.brush,
        func : ()=>{
            usfFunctionBar(player,"brush")
        }
    },
    {
        text : "其他功能",
        icon : pictures.craft_table,
        func : ()=>{
            usfFunctionBar(player,"other")
        }
    },
    ]
    ui.show(player)
}
function usfBoardBar(player){
    var ui = new btnBar()
    ui.title = "公告设置"
    ui.body = 
    ["此处管理服务器的公告板",
    "可以点击\"添加公告\"新建公告",
    "点击公告可以预览、编辑",
    "配置处可以修改公告基本设置"
     ]
    ui.btns = [{
        text : "配置",
        icon : ui_icon.sign,
        func : ()=>{
            usfFunctionBar(player , "board")
        }
    },
    {
        text : "添加公告",
        icon : ui_icon.add,
        func : ()=>{
            editBoardBar(player , `board${Date.now()}`)
        }
    }
    ]
    var boards = get_boards()
    for(var key of Object.keys(boards)){
        var text = (boards[key].able) ? "§2[启用]§r" : "§4[禁用]§r"
        if(boards[key].able && boards[key].up){
            text += "§n[顶置]§r"
        }
        ui.btns.push({
            text : text + boards[key].name,
            icon : (is_string(boards[key].icon)) ? pictures[boards[key].icon] : null,
            func : (op)=>{
                editBoardBar(player , op.key)
            },
            op : {
                "key" : key
            }
        })
    }
    ui.show(player)
}

function editBoardBar(player , id){
    var data = parse_json(get_data(id))
    if(Object.keys(data).length === 0){
        data = {
            able : true,
            texts : [],
            up : false,
            name : "",
            icon : null
        }
    }
    var ui = new infoBar()
    ui.title = "公告信息配置"
    ui.toggle("able","[禁用 | 启用]",data.able)
    ui.input("name","公告显示名称","输入名称",data.name)
    add_pictures_choice(ui,"选择公告的图标",data.icon)
    ui.toggle("up","顶置",data.up)
    ui.toggle("delete","删除",false)
    
    ui.cancel = ()=>{
        usfBoardBar(player)
    }
    
    ui.show(player,(r)=>{
        if(r["delete"] === true){
            clear_data(id)
            var ids = get_board_ids()
            array_clear(ids,id)
            save_data("board_ids",to_json(ids))
            usfBoardBar(player)
        }
        else{
            data.name = r.name
            data.up = r.up
            data.able = r.able
            data.icon = r.icon
            save_data(id,to_json(data))
            var ids = get_board_ids()
            if(array_has(ids,id) === false){
                ids.push(id)
            }
            save_data("board_ids",to_json(ids))
            
            var ed = new arrayEditor()
            ed.look = ()=>{
                return tran_text(player,data.texts)
            }
            ed.edit(player,data.texts)
            ed.back = ()=>{
                save_data(id,to_json(data))
                usfBoardBar(player)
            }
        }
    })
}

function editLock(player,index){
    var cf = lock_config[index]
    var ui =new infoBar()
    ui.cancel = ()=>{
        lock_config.splice(index,1)
        setLockBar(player)
    }
    ui.title = "编辑锁定物品"
    ui.input("id","物品id","输入id(如:minecraft:apple)",to_string(cf[1]))
    ui.range("count","物品数量",0,64,1,to_number(cf[2],1))
    ui.options("slot","锁定位置",[
        "物品栏1",
        "物品栏2",
        "物品栏3",
        "物品栏4",
        "物品栏5",
        "物品栏6",
        "物品栏7",
        "物品栏8",
        "物品栏9",
    ],to_number(cf[0],0))
    ui.toggle("de","删除",false)
    ui.show(player,(r)=>{
        if(r.de){
            lock_config.splice(index,1)
        }else{
            cf[0] = r.slot
            cf[1] = r.id
            cf[2] = r.count
        }
        save_lock_config()
        setLockBar(player)
    })
}

function setLockBar(player){
    var ui =new btnBar()
    ui.title = "物品锁定"
    ui.cancel = ()=>{
        usfSettingBar(player)
    }
    ui.body = "管理锁定物品"
    ui.btns.push({
        text :"添加",
        icon :ui_icon.add,
        func :()=>{
            lock_config.push([])
            editLock(player,lock_config.length -1)
        }
    })
    ui.btns.push({
        text :"立即重载",
        icon :ui_icon.go,
        func :()=>{
            for(var p of world.getAllPlayers()){
                reset_lock_item(p)
            }
            setLockBar(player)
        }
    })
    for(var i=0;i<lock_config.length;i++){
        var items = lock_config[i]
        ui.btns.push({
            text : `${items[1]}\n物品栏:${items[0]+1}`,
            op : {
                index : i
            },
            func : (op)=>{
                editLock(player,op.index)
            }
        })
    }

    ui.show(player)

}

function resetBoardBar(player){
    var ui = new btnBar()
    ui.title = "计分板默认值设置"
    ui.cancel = ()=>{
        usfSettingBar(player)
    }
    ui.body = ["当玩家计分板无值时，插件自动给予默认值"]
    for(var i=0;i<reset_boards.length;i++){
        var b = reset_boards[i]
        ui.btns.push({
            text : `计分板:${b[0]}\n默认值:${b[1]}`,
            op : {
                index : i
            },
            func : (op)=>{
                var bd = reset_boards[op.index]
                var ui2 = new infoBar()
                ui2.cancel = ()=>{
                    resetBoardBar(player)
                }
                ui2.title = "设置默认值"
                ui2.input("id","计分板ID","输入id",bd[0])
                ui2.input("value","默认值","输入整数",String(bd[1]))
                ui2.toggle("de","删除",false)
                ui2.show(player,(r)=>{
                    if(r.de){
                        reset_boards.splice(op.index,1)
                        save_reset_boards()
                        resetBoardBar(player)
                    }else{
                        bd[0] = r.id
                        bd[1] = to_number(parseInt(r.value))
                        save_reset_boards()
                        resetBoardBar(player)
                    }
                })
            }
        })
    }

    ui.btns.push({
        text : `添加`,
        icon : ui_icon.add,
        func : ()=>{
            var ui2 = new infoBar()
            ui2.cancel = ()=>{
                resetBoardBar(player)
            }
            ui2.title = "设置默认值"
            ui2.input("id","计分板ID","输入id","")
            ui2.input("value","默认值","输入整数","0")
            ui2.show(player,(r)=>{
                reset_boards.push([r.id,to_number(parseInt(r.value))])
                save_reset_boards()
                resetBoardBar(player)
            })
        }
    })
    ui.show(player)
}

//插件设置界面
function usfFunctionBar(player , type){
    var ui = new infoBar()
    ui.cancel = ()=>{
        usfSettingBar(player)
    }
    
    switch(type){
        case "online":
            ui.title = "在线计分板"
            var text = "下面填入只需要显示在线玩家的计分板id，多个id用;隔开\n插件会自动生成id\"名字_\"的计分板，这个计分板就是只显示在线玩家的计分板\n例如:Show计分板将生成Show_计分板"
            ui.input("online",text,"输入计分板id",config.other.online)
            break
        case "other":
            ui.title = "其他功能设置"
            ui.toggle("chat_board","留言板[禁用 | 启用]",config.other.chat_board)
            break
        case "log":
            ui.title = "日志设置"
            ui.toggle("able","[禁用 | 启用]",config.log.able)
            ui.range("down","(由于无法日志服务器时,控制台会弹出警告,当首次无法连接时,USF会进入冷却,暂停日志发送,以防止控制台刷屏)\n冷却时间",30,600,30,config.log.down)
            ui.input("address","日志服务器地址(一般不改)","输入地址",config.log.address)
            for(var name of data_format.logs){
                ui.toggle(name,get_text("log."+name),array_has(config.log.allow,name))
            }
            break
        case "reset":
            resetBoardBar(player)
            return
        case "hacker":
            ui.title = "反作弊设置"
            ui.toggle("back","回退操作[禁用 | 启用]",config.hacker.back)
            ui.toggle("kick","踢出玩家[禁用 | 启用]",config.hacker.kick)
            ui.toggle("chest","反自动偷箱",array_has(config.hacker.allow,"chest"))
            break
        case "store":
            ui.title = "全局商店设置"
            ui.toggle("able","全局商店[禁用 | 启用]",config.store.able)
            break
        case "score":
            ui.title = "积分设置"
            ui.toggle("able","[禁用 | 启用]",config.score.able)
            ui.input("id","积分的计分板id","输入id,若id不存在则会创建",config.score.id)
            var sc = get_score_config()
            for(var k of Object.keys(sc)){
                ui.toggle(k,get_text("score."+k) + "[关闭 | 开启]",array_has(config.scores,k))
                ui.input(k,"增加积分/次","输入分数",String(sc[k][0]))
                ui.input(k,"每日上限","输入分数",String(sc[k][1]))
            }
            break
        case "cd_items":
            var editor = new arrayEditor()
            editor.back = ()=>{
                save_config()
                usfSettingBar(player)
            }
            editor.edit(player,config.cd_items)
            return
            break
        case "brush":
            ui.title = "语言设置"
            ui.options("l","语言",["简体中文","繁体中文"],config.language)
            break
        case "group":
            ui.title = "群组设置"
            ui.toggle("able","[禁用 | 启用]",config.groups.able)
            ui.range("max","可创建群组数量(管理员可无限创建)",0,100,1,config.groups.max)
            break
        case "land":
            ui.title = "领地设置"
            ui.toggle("able","[禁用 | 启用](实验性功能)",config.land.able)
            ui.range("max","可创建领地数量(管理员可无限创建)",0,100,1,config.land.max)
            ui.input("board","领地扣费计分板id","输入id",config.land.board)
            ui.range("price","领地价格/每方块(最后价格约成整数)",0,10,1,config.land.price)
            ui.toggle("must","金额必须足够(若关闭，则计分板可能会被扣费成负数)",config.land.must)
            ui.input("show","领地提示语(/name转换为领地主名字)","输入提示语",config.land.show)
            break
        case "cd_con":
            var menu = to_array(parse_json(get_data("menu_text")),data_format.menu)
            var editor = new arrayEditor()
            editor.back = ()=>{
                save_data("menu_text",to_json(menu))
                usfSettingBar(player)
            }
            editor.tran = true
            editor.look = ()=>{
                return tran_text(player,menu)
            }
            editor.edit(player,menu)
            return
            break
        case "board":
            var boards = get_boards()
            var names = ["无"]
            var ids = Object.keys(boards)
            for(var key of ids){
                names.push(boards[key].name)
            }
            ids = [""].concat(ids)
            ui.title = "公告配置"
            ui.toggle("able","公告[关闭 | 开启]",config.board.able)
            
            ui.options("_","默认公告",names,array_index(ids,config.board["_"]))
            ui.match(ids)
            
            ui.options("first","发给新成员",names,array_index(ids,config.board.first))
            ui.match(ids)
            break
        case "hurttip":
            ui.title = "伤害血量功能设置"
            ui.toggle("able","伤害血量提示[关闭 | 开启]",config.hurt.able)
            ui.options("type","显示模式",["条状","心形"],config.hurt.type)
            break
        case "tran":
            ui.title = "转账机功能设置"
            ui.toggle("able","转账机[关闭 | 开启]",config.tran.able)
            ui.input("board","转账的计分板，多个之间用英文分号;分隔","输入计分板ID",config.tran.board)
            ui.range("free","手续费(百分比)",0,200,1,config.tran.free)
            break
        case "time":
            ui.title = "游戏时间统计"
            ui.toggle("able","游戏时间统计[关闭 | 开启]\n游戏时间的计分板id为time\n显示时间的计分板id为time_show",config.time.able)
            ui.options("type","统计时间",["每秒","每分钟"],config.time.type)
            ui.toggle("show","显示时间并锁定在玩家列表",config.time.show)
            break
        case "tip":
            ui.title = "进服欢迎提示"
            ui.toggle("able","进服欢迎提示[关闭 | 开启]",config.tip.able)
            ui.input("content","内容" + get_text("tran_text"),"输入内容",get_data("tip"))
            break
        case "chat":
            ui.title = "聊天格式"
            var text = get_text("tran_text") + "\n\n聊天格式设置(以下内容会被特殊转义)：\n/sender >>发送者名称\n/tag >>聊天头衔\n/text >>聊天内容"
            ui.input("format",text,"输入内容",config.chat.format)
            ui.toggle("clear","禁用彩色字符",to_bool(config.chat.clear))
            ui.input("l","消息长度限制(最大长度)","长度",String(config.chat.length))
            ui.input("tag","玩家默认头衔(无则显示为维度)","输入头衔",config.chat.tag)
            ui.toggle("disable","§e强行禁用USF聊天系统§r(+命令仍能使用)",to_bool(config.chat.disable))
            break
        case "name":
            ui.title = "玩家名格式设置"
            var text = get_text("tran_text") + "\n\n玩家名格式设置"
            ui.input("format",text,"输入内容",config.name.format)
            break
        case "pos":
            ui.title = "传送页面设置"
            ui.toggle("die","返回死亡点[关闭 | 开启]",config.tp.die)
            ui.toggle("per","个人传送点[关闭 | 开启]",config.tp.per)
            ui.toggle("pp","玩家互传TPA[关闭 | 开启]",config.tp.pp)
            ui.toggle("world","世界共享点[关闭 | 开启]",config.tp.world)
            ui.toggle("group","群组共享点[关闭 | 开启]",config.tp.group)
            ui.toggle("back","传送返回[关闭 | 开启]",config.tp.back)
            ui.toggle("share","分享传送点[关闭 | 开启]",config.tp.share)
            ui.range("per_count","个人传送点数量",1,55,1,config.tp.per_count)
            ui.range("random_range","随机传送距离(为0时不显示)",0,50000,1000,config.tp.random_range)
            ui.toggle("random_end","允许末地使用随机传送",config.tp.random_end)
            ui.range("down","TP冷却时间/s",0,600,10,config.tp.down)
            break
        case "game":
            ui.title = "游戏辅助设置"
            ui.toggle("kill","主菜单显示自杀按钮",config.game.kill)
            ui.toggle("creeper","苦力怕爆炸不破坏地形",config.game.creeper)
            ui.toggle("sign","编辑告示牌需要双击",config.game.sign)
            ui.toggle("lock","非op锁定生存模式",config.game.lock)
            ui.toggle("fb","可发射火焰弹",config.game.fb)
            ui.range("r_in","进入游戏给予抗性提升5的时间",0,30,1,config.game.r_in)
            ui.range("r_di","维度改变给予抗性提升5的时间",0,30,1,config.game.r_di)
            ui.range("r_rs","重生给予抗性提升5的时间",0,30,1,config.game.r_rs)
            break
        case "com":
            ui.title = "插件命令设置"
            for(var key of data_format.commands){
                ui.toggle(key,`+${key}(${get_text('commands.'+key)})`,array_has(config.commands,key))
            }
            break
    }
    
    ui.show(player,(r)=>{
        switch(type){
            case "board":
                config.board["_"] = r["_"]
                config.board["first"] = r["first"]
                config.board.able = r.able
                save_config()
                usfBoardBar(player)
                break
            case "online":
                config.other.online = r.online
                save_config()
                break
            case "tran":
                config.tran.able = r.able
                config.tran.board = r.board
                config.tran.free = Math.round(r.free)
                save_config()
                usfSettingBar(player)
                break
            case "group":
                config.groups.able = r.able
                config.groups.max = r.max
                save_config()
                usfSettingBar(player)
                break
            case "store":
                config.store.able = r.able
                save_config()
                usfSettingBar(player)
                break
            case "hacker":
                config.hacker.back = r.back
                config.hacker.kick = r.kick
                config.hacker.allow = []
                if(r.chest){
                    config.hacker.allow.push("chest")
                }
                save_config()
                usfSettingBar(player)
                break
            case "brush":
                config.language = r.l
                save_config()
                usfSettingBar(player)
                break
            case "hurttip":
                config.hurt.able = r.able
                config.hurt.type = r.type
                save_config()
                usfSettingBar(player)
                break
            case "land":
                config.land.able = r.able
                config.land.must = r.must
                config.land.price = r.price
                config.land.board = r.board
                config.land.max = r.max
                config.land.show = r.show
                save_config()
                if(r.able){
                    tip(player,"领地为实验性功能，可能会破坏您的存档！请谨慎使用",()=>{
                        if(un(world.scoreboard.getObjective(config.land.board))){
                            confirm(player,"刚才配置的计分板不存在！领地功能无法使用！",()=>{
                                usfSettingBar(player)
                            })
                        }else{
                            usfSettingBar(player)
                        }
                    })
                }else{
                    usfSettingBar(player)
                }
                break
            case "time":
                config.time.able = r.able
                config.time.type = r.type
                config.time.show = r.show
                save_config()
                usfSettingBar(player)
                break
            case "tip":
                config.tip.able = r.able
                save_data("tip",r.content)
                save_config()
                usfSettingBar(player)
                break
            case "log":
                config.log.able = r.able
                config.log.down = r.down
                config.log.address = r.address
                config.log.allow = []
                for(var name of Object.keys(r)){
                    if(array_has(data_format.logs,name)){
                        if(r[name]){
                            config.log.allow.push(name)
                        }
                    }
                }
                save_config()
                usfSettingBar(player)
                break
            case "chat":
                config.chat.format = r.format
                config.chat.clear = r.clear
                config.chat.length = to_number(parseInt(r.l),1024)
                config.chat.tag = r.tag
                config.chat.disable = r.disable
                save_config()
                usfSettingBar(player)
                break
            case "name":
                config.name.format = r.format
                save_config()
                usfSettingBar(player)
                break
            case "com":
                config.commands = []
                for(var key of Object.keys(r)){
                    if(r[key]){
                        config.commands.push(key)
                    }
                }
                save_config()
                usfSettingBar(player)
                break
            case "score":
                config.score.id = r.id
                config.score.able = r.able
                var un_ids = ["id"  , "able"]
                var sc = get_score_config()
                config.scores = []
                for(var k of Object.keys(r)){
                    if(!array_has(un_ids,k)){
                        if(r[k][0] === true){
                            config.scores.push(k)
                        }
                        sc[k] = [to_number(parseFloat(r[k][1]),0) , to_number(parseFloat(r[k][2]),0)]
                    }
                }
                save_data("score_config",to_json(sc))
                save_config()
                usfSettingBar(player)
                break
            case "pos":
                config.tp.random_range = r.random_range
                config.tp.random_end = r.random_end
                config.tp.die = r.die
                config.tp.world = r.world
                config.tp.per = r.per
                config.tp.share = r.share
                config.tp.pp = r.pp
                config.tp.per_count = r.per_count
                config.tp.down = r.down
                config.tp.group = r.group
                config.tp.back = r.back
                save_config()
                usfSettingBar(player)
                break
            case "other":
                config.other.chat_board = r.chat_board
                save_config()
                usfSettingBar(player)
                break
            case "game":
                config.game.kill = r.kill
                config.game.creeper = r.creeper
                config.game.sign = r.sign
                config.game.lock = r.lock
                config.game.r_in = r.r_in
                config.game.r_di = r.r_di
                config.game.fb = r.fb
                config.game.r_rs = r.r_rs
                save_config()
                usfSettingBar(player)
                break
        }
    })
}

function show_board(player , id = null){
    var boards = get_boards()
    if(config.board.able === false || boards.length === 0){
        return
    }
    var ids = Object.keys(boards)
    for(var i of ids){
        if(boards[i].able === false){
            array_clear(ids,i)
        }
    }
    var board = null
    var current_id = id
    if(id === null){
        if(player.info.join_times === 1 && is_object(boards[config.board.first])){
            board = boards[config.board.first]
            current_id = config.board.first
        }
        if(board === null && is_object(boards[config.board["_"]])){
            board = boards[config.board["_"]]
            current_id = config.board["_"]
        }
    }else{
        board = boards[id]
    }
    if(board === null){
        var i = ids[random_int(ids.length)]
        board = boards[i]
        current_id = i
    }
    var ui = new btnBar()
    ui.busy = null
    ui.title = board.name
    ui.body = tran_text(player,board.texts,true)
    ui.btns = [{
        text : "主菜单",
        icon : ui_icon.craft_table,
        func : ()=>{
            cdBar(player)
        }
    }]

    for(var i=0;i<ids.length;i++){
        var last_id = ids[i]
        if(last_id !== current_id && boards[last_id].able){
            ui.btns.push({
                text : (boards[last_id].up ? "§n[顶置]§r" : "") + boards[last_id].name,
                icon : (is_string(boards[last_id].icon)) ? pictures[boards[last_id].icon] : null,
                func : (op)=>{
                    show_board(player,String(op.ii))
                },
                op : {
                    ii : last_id
                }
            })
            if(boards[last_id].up){
                ui.btns.splice(0,0,ui.btns.pop())
            }
        }
    }
    ui.show(player)
}

// function show_board(player){
    // var content = get_data("board_content")

    
    // var ui = new ui.btnBar()
    // ui.title = "公告板"
    // ui.body = content
    
    // ui.setBusy("again",40)
    // ui.setCancel("close")
    
    // if(enable_settings.board.length < totals.length && full_text === false){
        // ui.addButton("展开§?Unfold",{icon:ui_icon.down},(id,option) => {
            // show_board(player,true)
        // })
    // }
    
    // ui.addButton("打开主菜单§?Menu Page",{icon:ui_path + "icon_crafting.png"},(id,option) => {
        // try_cdBar(player)
    // })
    // ui.addButton("交易系统§?Trade Page",{icon:ui_path + "icon_deals.png"},(id,option) => {
        // tradeBar(player)
    // })
    // ui.addButton("帮助页面§?Help",{icon:ui_path + "how_to_play_button_default.png"},(id,option) => {
        // helpBar(player)
        // player_history(player,show_board)
    // })
    // ui.addButton("语言设置/Language",{icon:ui_path + "world_glyph_color_2x.png"},(id,option) => {
        // var ui = new infoBar()
        // ui.back_func = ()=>{
            // show_board(player)
        // }
        // ui.setCancel("run",()=>{
            // show_board(player)
        // })
        // languageBar(player,ui)
    // })
    
    // if(is_page_changer(player)){
            // ui.addButton("编辑此页面§?Edit this page",{"icon":ui_icon.setting},(id,option) =>{
            // pageSetBar(player,"board",() => {
              // cdBar(player)
            // })  
          // })
        // ui.addButton("编辑公告内容§?Edit this page content",{icon:ui_icon.page},(id,option) =>{
            // var ui = new arrayEditor()
                // ui.tran = true
                // ui.array = [...totals]
                // ui.callback = function(result){
                    // totals = result
                    // save_totals()
                // }
                // ui.finish = () =>{
                    // show_board(player)
                // }
                // ui.show(player)
        // })
    // }
    // if(has_feature("Board")){
        // ui.show(player)
    // }
// }


//工具函数


function clear_colour(text){
    return text.replace(/§./g,"")
}

//判断变量是否是string
function is_string(v ){
     return typeof(v) == "string" ? true : false
}

function is_function(v ){
     return typeof(v) == "function" ? true : false
}

function to_bool(v , none = false){
    if(typeof (v) === "boolean"){
        return v
    }
    return none
}

function is_object(v ){
     return typeof(v) == "object" ? true : false
}

function is_array(v ){
     return Array.isArray(v)
}

//下面是格式化函数

function to_string(value , none = ""){
    return typeof(value) == "string" ? value : none
}

function to_array(value , none = []){
    return Array.isArray(value) ? value : none
}

function to_object(value , none = {}){
    return typeof(value) == "object" ? value : none
}

function array_index(array ,text , none = 0){
    var index = array.indexOf(text)
    return (index >= 0) ? index : none
}

function add_pictures_choice(ui , text , choice = null){
    var texts = ["无"]
    var keys = Object.keys(pictures)
    for(var k of keys){
        texts.push(get_text("Pictures." + k ))
    }
    ui.options("icon",text,texts,(keys.indexOf(choice) === -1) ? 0 : keys.indexOf(choice)+1)
    ui.match([null].concat(Object.keys(pictures)))
}

function random_int(max = 10){
    return Math.floor(Math.random()*max)
}

function array_clear(array , text){
    while(array.indexOf(text) >= 0){
        array.splice(array.indexOf(text),1)
    }
}
function array_has(array , text){
    if(array.indexOf(text) >= 0){
        return true
    }
    return false
}

function is_number(value ){
    if(typeof(value) == "number" ){
        if(!isNaN(value)){
            return true
        }
    }
    return false
}

function to_number(value , none = 0){
    if(typeof(value) == "number" ){
        if(!isNaN(value)){
            return value
        }
    } 
    return none
}

function array2string(array = [] , none = "" , clear_color = false){
    if(is_string(array)){return array}
    else{
        if(is_array(array)){
            var text = ""
            for(var cf of array){
                text += "\n"
                if(clear_color){
                    text += "§r"
                }
                text += cf
            }
            return text.slice(1)
        }
    }
    return none
}

function parse_number(text , none = 0){
    var num = parseFloat(text)
    if(Number.isNaN(num)){
        return none
    }
    return num
}

function array_get(arr , index , none = ""){
    if(arr.length > index){
        return arr[index]
    }
    return none
}

function string_has(str,text){
    if(str.indexOf(text) === -1){
        return false
    }
    return true
}

function format(id , replacer){
    var text = get_text(id)
    for(var i = 0; i < replacer.length; i++){
        text = text.replaceAll(("["+String(i)+"]") , String(replacer[i]))
    }
    return text
}

function parse_json(data){
    if(!is_string(data) || data == ""){return {}}
    try{
        data = JSON.parse(data)
    }catch(e){}
    return to_object(data,{})
}

function pos_string(vec){
    return `(${Math.round(vec.x)},${Math.round(vec.y)},${Math.round(vec.z)})`
}

//to_json必须传入object
function to_json(data){
    if(!is_object(data)){return }
    try{
        data = JSON.stringify(data)
    }catch(e){}
    return to_string(data,"{}")
}

//文本格式化
function tran_text(player,texts,keep_array = false){
    var things = {}
    
    if(is_player(player)){
        var spawn = player.getSpawnPoint()
        if(un(spawn)){
            spawn = world.getDefaultSpawnLocation()
        }
        spawn.y = 64
        things =  {
            name : player.name,
            pos : pos_string(player.location),
            dimension : player.dimension.name,
            tag : get_chat_tag(player),
            health : String(Math.ceil(player.health.currentValue)),
            level : String(player.level),
            respawn : get_block_pos({location:spawn}),
            join : String(player.info.join_times)
        }
    var boards = world.scoreboard.getObjectives()
    for(var b of boards){
        if(b.hasParticipant(player)){
            things["board."+b.id] = String(b.getScore(player))
        }else{
            things["board."+b.id]  = "0"
        }
    }
    }
    
    var tran = function(line){
        if(line.startsWith("**")){

        }else{
            if(string_has(line,"/")){
                for(var k of Object.keys(tran_info)){
                    line = line.replaceAll("/"+k , tran_info[k])
                }
                for(var k of Object.keys(things)){
                    line = line.replaceAll("/"+k , things[k])
                }
            } 
        }
        
        line = line.replaceAll("/n","\n")
        return line
    }
    
    var text = []
    
    if(is_array(texts)){
        for(var cf=0; cf<texts.length;cf++){
            text.push(tran(texts[cf]))
        }

        if(keep_array){
            return text
        }
        else{
            return array2string(text , "" ,true)
        }
    }
    if(is_string(texts)){
        text = tran(texts)
    }
    
    return text
}


function un(v){
    if(typeof(v) === "undefined"){
        return true
    }
    return false
}

function server_log(type , text , path){
    if(!log_config.able || !config.log.able){
        return
    }
    if(!log_config.server){
        return
    }
    type = (type === 0) ? "log" : "print"
    text = clear_colour(text)
    logs.push({
        type : encodeURI(type),
        text : encodeURI(text),
        path : encodeURI(path)
    })

}