enum Choice {
    //% block="year"
    year,
    //% block="month"
    month,
    //% block="day"
    day,
    //% block="hour"
    hour,
    //% block="minute"
    minute,
    //% block="second"
    second,
    //% block="UnixTime"
    UnixTime
}

enum Pm {
    //% block="+"
    p,
    //% block="-"
    m
}

enum Tz_h {
    //% block="0"
    zero,
    //% block="1"
    one,
    //% block="2"
    two,
    //% block="3"
    three,
    //% block="4"
    four,
    //% block="5"
    five,
    //% block="6"
    six,
    //% block="7"
    seven,
    //% block="8"
    eight,
    //% block="9"
    nine,
    //% block="10"
    ten,
    //% block="11"
    eleven,
    //% block="12"
    twelve
}

enum Tz_m {
    //% block="0"
    zero,
    //% block="15"
    fifteen,
    //% block="30"
    thirty,
    //% block="45"
    fourty_five
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
    let diff_sec = 0;
    let serial_initialized = false;
    let time_initialized = false;

    /**
     * Initialize micro:bit for TfabConnect. Initialize the serial-port and the date.
    */
    function serialInitialize(): void {
        serial.redirect(
            SerialPin.USB_TX,
            SerialPin.USB_RX,
            BaudRate.BaudRate9600
        )
        serial.writeString("\r\n"); // ヌル文字をいったんクリア
        _ = serial.readString(); // 受信バッファのゴミ除去
        basic.pause(100);
    }

    function timeInitialize(): void {
        if (unixtime_init <= 0) {
            unixtime_init = readValue("__now");
        }

        if (time_initialized == false) {
            running_init = Math.trunc(input.runningTime() / 1000);
            time_initialized = true;
        }
    }

    /**
     * Set the time difference from Greenwich Mean Time.
     * @param pm
     * @param tz_h
     * @param tz_m
    */
    //% blockId=Tz_initialize block="set Timezone %Pm| %Tz_h| hour %Tz_m minute"
    export function Tzsetting(pm: Pm, tz_h: Tz_h, tz_m: Tz_m): void {
        switch (tz_h) {
            case Tz_h.twelve:
                diff_sec += 43200
                break
            case Tz_h.eleven:
                diff_sec += 39600
                break
            case Tz_h.ten:
                diff_sec += 36000
                break
            case Tz_h.nine:
                diff_sec += 32400
                break
            case Tz_h.eight:
                diff_sec += 28800
                break
            case Tz_h.seven:
                diff_sec += 25200
                break
            case Tz_h.six:
                diff_sec += 21600
                break
            case Tz_h.five:
                diff_sec += 18000
                break
            case Tz_h.four:
                diff_sec += 14400
                break
            case Tz_h.three:
                diff_sec += 10800
                break
            case Tz_h.two:
                diff_sec += 7200
                break
            case Tz_h.one:
                diff_sec += 3600
                break
            case Tz_h.zero:
                diff_sec += 0
                break
            default:
                diff_sec += 0
                break
        }

        switch (tz_m) {
            case Tz_m.zero:
                diff_sec += 0
                break
            case Tz_m.fifteen:
                diff_sec += 900
                break
            case Tz_m.thirty:
                diff_sec += 1800
                break
            case Tz_m.fourty_five:
                diff_sec += 2700
                break
            default:
                diff_sec += 0
                break
        }

        switch (pm) {
            case Pm.m:
                diff_sec = -diff_sec
                break
            default:
                diff_sec += 0
                break
        }

    }
    /**
     * Sets this cloud-variable to be equal to the input number.
     * @param varName name of Cloud-Variable, eg: 
     * @param value write value to Cloud-Variable
     */
    //% blockId=serial_writeid_value block="set cloud-variable %varName| to %value|"
    export function writeValue(varName: string, value: number): void {
        if (serial_initialized == false) {
            serialInitialize();
            serial_initialized = true;
        }
        let csv = '' + input.runningTime() + ',' + control.deviceSerialNumber() + ',w,' + varName + ',' + value;
        let hash = computeHash(csv);
        serial.writeLine(csv + ',' + hash);
        basic.pause(writeWaitTime);
    }

    /**
     * Read the number from cloud-variable.
     * @param varName name of Cloud-Variable, eg:
     */
    //% blockId=serial_result block="cloud-variable%varName|"
    export function readValue(varName: string) {
        if (serial_initialized == false) {
            serialInitialize();
            serial_initialized = true;
        }

        let receiveNumber;
        let csv = '' + input.runningTime() + ',' + control.deviceSerialNumber() + ',r,' + varName + ',0'
        let hash = computeHash(csv);
        serial.writeLine(csv + ',' + hash);
        basic.pause(readWaitTime);

        let str = serial.readString();
        receiveNumber = parseFloat(str);

        if (str == "" || str == "err") {
            let v = kvs[varName];
            if (!kvs[varName]) {
                return 0;
            }
            return v;
        }
        kvs[varName] = receiveNumber;

        return receiveNumber;
    }

    function getcurrenttime() {
        if (time_initialized == false) {
            timeInitialize();
        }
        if (unixtime_init <= 0) {
            basic.showIcon(IconNames.No);
            timeInitialize();
        }
        running_current = Math.trunc(input.runningTime() / 1000);
        unixtime_current = unixtime_init + (running_current - running_init);
        return unixtime_current;
    }

    function sec2date(sec: number) {
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

        let unix_show = Math.trunc(sec);

        //時差補正
        //sec += 32400; //日本時間の例
        sec += diff_sec

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

    /**
     * Get the date.
     * @param choice 
     */
    //% blockId=watch_time block="time %Choice"
    export function time(choice: Choice) {
        let result = sec2date(getcurrenttime());
        switch (choice) {
            case Choice.year:
                return result[0];
            case Choice.month:
                return result[1];
            case Choice.day:
                return result[2];
            case Choice.hour:
                return result[3];
            case Choice.minute:
                return result[4];
            case Choice.second:
                return result[5];
            case Choice.UnixTime:
                return result[6];
            default:
                return 0;
        }
    }
}
