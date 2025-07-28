"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversionJobHandler = void 0;
const redisQueue_1 = require("./redisQueue");
const convertProcessMetaData_1 = require("./convertProcessMetaData");
const mediaConvertJob_1 = require("./mediaConvertJob");
const folderForDashFile_1 = require("./folderCreation/folderForDashFile");
class conversionJobHandler {
    // Private constructor prevents direct instantiation
    constructor() {
        this.process = false;
    }
    // Static method to get the singleton instance
    static getInstance() {
        if (!conversionJobHandler.instance) {
            conversionJobHandler.instance = new conversionJobHandler();
        }
        return conversionJobHandler.instance;
    }
    jobHandler() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.process === false) {
                const obj = yield (0, redisQueue_1.peekFirstJob)();
                if (obj) {
                    // set new process   
                    const data = (0, convertProcessMetaData_1.Convert)(obj);
                    (0, folderForDashFile_1.creteFolderForDash)(data).then(r => {
                        console.log(r);
                        (0, mediaConvertJob_1.startFlexibleMediaConvertJob)(data).then(r1 => { console.log(r1); }).catch(e => console.log(e));
                    }).catch(e => console.log(e));
                }
            }
        });
    }
    // Example method
    getProcess() {
        return this.process;
    }
    setProcess(data) {
        this.process = data;
    }
}
exports.conversionJobHandler = conversionJobHandler;
