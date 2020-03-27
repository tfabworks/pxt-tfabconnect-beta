enum Choice {
    //% block="年"
    Year,
    //% block="月"
    Month,
    //% block="日"
    Day,
    //% block="時"
    Hour,
    //% block="分"
    Minute,
    //% block="秒"
    Second,
    //% block="UnixTime"
    UnixTime
}

//% weight=2 color=#3276f4 icon="\uf0c2"
namespace TFabConnectBeta {
    let writeWaitTime = 1000;
    let readWaitTime = 3000;
    let _;
    let unixtime_init = 0;
    let unixtime_current = 0;
    let running_init = 0;
    let running_current = 0;
    let kvs: { [key: string]: number; } = {};

    //% blockId=serial_initialize block="初期化"
    export function serialInitialize(): void {
        serial.redirect(
            SerialPin.USB_TX,
            SerialPin.USB_RX,
            BaudRate.BaudRate9600
        )
        serial.writeString("\r\n"); // ヌル文字をいったんクリア
        _ = serial.readString(); // 受信バッファのゴミ除去
        unixtime_init = readValue("__now");
        running_init = Math.trunc(input.runningTime() / 1000);
    }

    /**
     * Write a name:value pair as a line to the serial port.
     * @param varName name of Cloud-Variable, eg: 
     * @param value write value to Cloud-Variable
     */
    //% blockId=serial_writeid_value block="クラウド変数%varNameを%valueにする"
    export function writeValue(varName: string, value: number): void {
        let csv = '' + input.runningTime() + ',' + control.deviceSerialNumber() + ',w,' + varName + ',' + value;
        let hash = computeHash(csv);
        serial.writeLine(csv+','+hash);
        basic.pause(writeWaitTime);
    }

    /**
     * Write a name:value pair as a line to the serial port.
     * @param varName name of Cloud-Variable, eg:
     */
    //% blockId=serial_result block="クラウド変数%varName"
    export function readValue(varName: string) {
        let receiveNumber;
        let csv = '' + input.runningTime() + ',' + control.deviceSerialNumber() + ',r,' + varName + ',0'
        let hash = computeHash(csv);
        serial.writeLine(csv+','+hash);
        basic.pause(readWaitTime);

        let str = serial.readString();
        receiveNumber = parseFloat(str);
        serial.writeLine('debug:readedStr:'+str+',readedNum:'+receiveNumber);
        if (str == "") {
            let v = kvs[varName];
            if (!kvs[varName]) {
                serial.writeLine('debugNan:' + v);
                return 0;
            }
            serial.writeLine('debug:' + v);
            return v;
        }
        kvs[varName]=receiveNumber;
        return receiveNumber;
    }

    /**
     * setting wait time.
     * @param msec , eg:5000
     */

    export function getcurrenttime() {
        running_current = Math.trunc(input.runningTime() / 1000);
        unixtime_current = unixtime_init + (running_current - running_init);
        return unixtime_current;
    }

    export function sec2date(sec = getcurrenttime()) {
        //変数定義
        let t = [];
        let y = 0;
        let m = 0;
        let d = 0;
        let n = 0;
        let cnt = 0;
        const sec365 = 31536000;
        const sec366 = 31622400;
        let i = 0;

        //2000/01/01 00:00:00の例外
        if (sec == 946652400) {
            const x = [2000, 1, 1, 0, 0];
            return x;
        }

        //9時間分の時差を補正
        let unix_show = Math.trunc(sec);
        sec = sec + 32400;

        //yearを求める
        let sec_y = sec;
        while (sec_y > sec365) {
            if (cnt % 4 == 2) {
                sec_y -= sec366;
                cnt += 1;
            } else {
                sec_y -= sec365;
                cnt += 1;
            }
        }
        y = 1970 + cnt;

        if (y % 4 == 0 && sec_y >= 5097600 && sec_y <= 5183999) {// 閏日
            m = 2;
            d = 29;
            let amaridays = Math.trunc(sec_y / 86400);
            let hour_pre = ((sec_y / 86400) - amaridays) * 24;
            let hour = Math.abs(hour_pre);
            let hour_show = Math.trunc(hour_pre);
            let min_pre = hour_pre + 9 + "";
            let min = parseFloat('0.' + min_pre.split(".")[1]) * 60;
            let min_int = Math.trunc(Math.round(min * 10000000000) / 10000000000);
            let sec = (min - min_int) * 60;
            let sec_int = Math.trunc(Math.round(sec * 10000000000) / 10000000000);
            let y_int = Math.trunc(y);

            const x = [y_int, m, d, hour_show, min_int, sec_int, unix_show];
            return x;
        } else {//うるう日以外
            let amaridays = Math.trunc(sec_y / 86400);
            if (y % 4 == 0) {//うるう年のうるう日以外
                t = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
                for (i = 0; i < 14; i++) {
                    if (amaridays < t[i]) {
                        d = amaridays - t[i - 1] + 1;
                        break;
                    }
                }
                m = i;

                let hour_pre = ((sec_y / 86400) - amaridays) * 24;
                let hour = Math.abs(hour_pre);
                let hour_show = Math.trunc(hour_pre);
                let min_pre = hour_pre + 9 + "";
                let min = parseFloat('0.' + min_pre.split(".")[1]) * 60;
                let min_int = Math.trunc(Math.round(min * 10000000000) / 10000000000);
                let sec = (min - min_int) * 60;
                let sec_int = Math.trunc(Math.round(sec * 10000000000) / 10000000000);
                let y_int = Math.trunc(y);

                const x = [y_int, m, d, hour_show, min_int, sec_int, unix_show];
                return x;

            } else {//通常年
                t = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
                for (i = 0; i < 14; i++) {
                    if (amaridays < t[i]) {
                        d = amaridays - t[i - 1] + 1;
                        break;
                    }
                }
                m = i;

                let hour_pre = ((sec_y / 86400) - amaridays) * 24;
                let hour = Math.abs(hour_pre);
                let hour_show = Math.trunc(hour_pre);
                let min_pre = hour_pre + 9 + "";
                let min = parseFloat('0.' + min_pre.split(".")[1]) * 60;
                let min_int = Math.trunc(Math.round(min * 10000000000) / 10000000000);
                let sec = (min - min_int) * 60;
                let sec_int = Math.trunc(Math.round(sec * 10000000000) / 10000000000);
                let y_int = Math.trunc(y);

                const x = [y_int, m, d, hour_show, min_int, sec_int, unix_show];
                return x;
            }
        }
    }

    // https://github.com/microsoft/pxt-radio-blockchain/blob/master/main.ts
    // MIT Lincense
    // Copyright (c) Microsoft Corporation. All rights reserved.
    // https://github.com/microsoft/pxt-radio-blockchain/blob/master/LICENSE
    function computeHash(str: string) {
        let s = "" + str
        /**
         * dbj2 hashing, http://www.cse.yorku.ca/~oz/hash.html
         */
        let hash = 5381;
        for (let i = 0; i < s.length; i++) {
            let c = s.charCodeAt(i);
            hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
        }
        return hash & 0xffff;
    }

    //% blockId=watch_time block="時間 %Choice"
    export function time(choice: Choice) {
        let result = sec2date(getcurrenttime());

        switch (choice) {
            case Choice.Year:
                return result[0];
            case Choice.Month:
                return result[1];
            case Choice.Day:
                return result[2];
            case Choice.Hour:
                return result[3];
            case Choice.Minute:
                return result[4];
            case Choice.Second:
                return result[5];
            case Choice.UnixTime:
                return result[6];
            default:
                return 0;
        }
    }
}
