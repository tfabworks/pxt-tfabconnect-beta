/**
 * Reading and writing data over a serial connection.
 */
//% weight=2 color=#3276f4 icon="\uf0c2"
namespace TFabConnect {
    let waitTime = 3000;
    let _;

    //% blockId=serial_initialize block="初期化"
    export function serialInitialize(): void {
        serial.redirect(
            SerialPin.USB_TX,
            SerialPin.USB_RX,
            BaudRate.BaudRate115200
        )
        serial.writeString("\r\n"); // ヌル文字をいったんクリア
        _ = serial.readString(); // 受信バッファのゴミ除去
    }

    /**
     * Write a name:value pair as a line to the serial port.
     * @param varName name of Cloud-Variable, eg: 
     * @param value write value to Cloud-Variable
     */
    //% blockId=serial_writeid_value block="クラウド変数%varNameに値%valueを書く"
    export function writeValue(varName: string, value: number): void {
        serial.writeLine('{"t":"' + input.runningTime() + '","s":"' + control.deviceSerialNumber() + '","m":"w","n":"' + varName + '","v":"' + value + '"}');
    }

    /**
     * Write a name:value pair as a line to the serial port.
     * @param varName name of Cloud-Variable, eg:
     */
    //% blockId=serial_result block="クラウド変数%varName"
    export function readValue(varName: string) {
        let receiveNumber;
        serial.writeLine('{"t":"' + input.runningTime() + '","s":"' + control.deviceSerialNumber() + '","m":"r","n":"' + varName + '","v":"0"}');
        basic.pause(waitTime);

        receiveNumber = parseFloat(serial.readString());
        if (isNaN(receiveNumber)) {
            return 0;
        }
        return receiveNumber;
    }

    /**
     * setting wait time.
     * @param msec , eg:5000
     */
    //% blockId=set_wait_time block="応答待ち時間(ミリ秒）%msec"
    //% advanced=true
    export function setWaitTime(msec: number) {
        waitTime = msec;
    }

    function isNaN(x: number) {
        return x !== x;
    }
}
