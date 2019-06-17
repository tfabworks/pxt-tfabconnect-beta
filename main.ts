/**
 * Reading and writing data over a serial connection.
 */
//% weight=2 color=#3276f4 icon="\uf0c2"
namespace TFabConnect {
    let waitTime = 3000;

    //% blockId=serial_initialize block="初期化"
    export function serialInitialize(): void {
        serial.redirect(
            SerialPin.USB_TX,
            SerialPin.USB_RX,
            BaudRate.BaudRate115200
        )
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
    //% blockId=serial_result block="クラウド変数%varNameを読んだ値"
    export function readValue(varName: string) {
        serial.writeLine('{"t":"' + input.runningTime() + '","s":"' + control.deviceSerialNumber() + '","m":"r","n":"' + varName + '","v":"0"}');
        basic.pause(waitTime);
        return serial.readString();
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
}
