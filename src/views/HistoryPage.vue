<template>
    <ion-page>
        <ion-header>
            <div class="appbar">
                <div class="title" @click="goToConfig">{{ kitchanName }}</div>
                <div class="right-side">
                    <ion-datetime-button class="datepicker" datetime="datetime">
                    </ion-datetime-button>
                    <select v-model="form.status" class="no-input" style="color: black">
                        <option value="all">ทั้งหมด</option>
                        <option value="print">พิมพ์</option>
                        <option value="notPrint">ยังไม่พิมพ์</option>
                    </select>
                    <input
                        class="no-input"
                        type="text"
                        v-model="form.orderNo"
                        placeholder="เลขที่ทำรายการ"
                    />
                    <button class="btn-search" @click="getOrderList">ค้นหา</button>
                </div>
            </div>
        </ion-header>

        <ion-content v-if="!showDetail" :fullscreen="true" class="ion-padding bg-style">
            <div
                class="order-item"
                :style="{ backgroundColor: order.isPrint === 'PRINT' ? '#B9F6CA' : '#FFCDD2' }"
                v-for="(order, index) in orderList"
                :key="index"
            >
                <div class="order-header">
                    <div>Order No: {{ order.orderNo }}</div>
                    <div>Order Date: {{ dayjs(order.orderDate).format('DD/MM/YYYY') }}</div>
                    <ion-icon
                        :icon="printOutline"
                        size="large"
                        @click="printOrder(order)"
                    ></ion-icon>
                </div>
                <div class="order-status">
                    <div>Order Status: {{ order.orderStatus }}</div>
                    <div>Print Status: {{ order.isPrint }}</div>
                </div>
                <div class="order-go-detail" @click="openOrderDetail(order)">
                    <ion-icon :icon="arrowForwardCircleOutline" size="large"></ion-icon>
                </div>
            </div>
        </ion-content>
        <ion-content v-else :fullscreen="true" class="ion-padding bg-style">
            <div class="order-detail-box">
                <div class="header">
                    <div>Order No: {{ orderNo }}</div>
                    <div>Order Date: {{ dayjs(orderDate).format('DD/MM/YYYY') }}</div>
                </div>
                <div class="menu-list">
                    <div>Menu:</div>
                    <ul>
                        <li v-for="(item, index) in menuList" :key="index">
                            {{ index + 1 }}. {{ item }}
                        </li>
                    </ul>
                </div>
            </div>
            <div class="order-detail-action">
                <div class="btn-back" @click="showDetail = false">
                    <ion-icon :icon="caretBackOutline" style="font-size: 20px"></ion-icon>
                    Go Back
                </div>
                <div class="btn-print" @click="printOrder(selectedOrder)">
                    Print Order
                    <ion-icon :icon="print" style="font-size: 20px"></ion-icon>
                </div>
            </div>
        </ion-content>
        <ion-modal :keep-contents-mounted="true">
            <ion-datetime id="datetime" v-model="form.date"></ion-datetime>
        </ion-modal>
    </ion-page>
</template>
<script>
import dayjs from 'dayjs'
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonSpinner,
    IonToggle,
    IonIcon,
    IonFooter,
    IonButtons,
    IonProgressBar,
    IonDatetime,
    IonDatetimeButton,
    loadingController,
    IonModal
} from '@ionic/vue'
import { arrowForwardCircleOutline, printOutline } from 'ionicons/icons'
import { defineComponent } from 'vue'
import axios from 'axios'
import Printer from '../services/imin-printer.esm.browser'
import { Preferences } from '@capacitor/preferences'
export default defineComponent({
    name: 'HistoryPage',

    components: {
        IonContent,
        IonHeader,
        IonPage,
        IonTitle,
        IonToolbar,
        IonButton,
        IonSpinner,
        IonToggle,
        IonIcon,
        IonFooter,
        IonButtons,
        IonProgressBar,
        IonDatetime,
        IonDatetimeButton,
        IonModal
    },

    data() {
        return {
            form: {
                orderNo: '',
                status: 'all',
                date: new Date().toISOString()
            },
            printer: null,
            kitchanName: 'Kitchan Name',
            isAutoPrint: false,
            showDetail: false,
            orderNo: 'xxxx',
            orderDate: 'xxxx',
            orderStatus: 'xxx',
            printStatus: 'xxx',
            menuList: ['Menu 1', 'Menu 2', 'Menu 3'],
            arrowForwardCircleOutline,
            printOutline,
            selectedOrder: null,
            orderList: [
                {
                    id: 1825,
                    createdAt: '2025-04-03T14:16:06.038Z',
                    updatedAt: '2025-04-03T14:16:06.038Z',
                    deletedAt: null,
                    orderNo: '1202504030002',
                    orderDate: '2025-04-03T14:16:06.044Z',
                    orderStatus: 'select_payment',
                    receivedStatus: 'cooking',
                    paid: NaN,
                    change: NaN,
                    serviceChargeRate: 0,
                    serviceCharge: 0,
                    total: 250,
                    vat: 0,
                    vatRate: 0,
                    discount: 0,
                    grandTotal: 250,
                    remark: '',
                    voidReason: null,
                    roomNo: '3901',
                    Hn: 'ีรพ TEST',
                    customerName: 'วินัย ใจสะอาด',
                    isRead: false,
                    isPrint: 'PRINT',
                    branch: {
                        id: 1,
                        createdAt: '2024-08-24T13:22:16.337Z',
                        updatedAt: '2024-08-24T13:22:16.337Z',
                        deletedAt: null,
                        code: '00000',
                        name: 'Headquarter',
                        address: 'BKK'
                    },
                    device: {
                        id: 2,
                        createdAt: '2024-11-04T15:11:06.023Z',
                        updatedAt: '2024-11-04T15:11:06.023Z',
                        deletedAt: null,
                        code: 'WEB001',
                        name: 'WEB001'
                    },
                    orderItems: [
                        {
                            id: 1,
                            name: 'แกงเขียวหวานทำจากนมถั่วเหลืองเสริฟกับข้าวกล้องหอมมะลิ และทอดมันแพลนต์เบส (Vegan)',
                            price: 250,
                            cooking: 'ครัวฝรั่ง'
                        },
                        {
                            id: 2,
                            name: 'ข้าวผัดกะเพราแพลนต์เบส (Vegan)',
                            price: 250,
                            cooking: 'ครัวฝรั่ง'
                        },
                        {
                            id: 3,
                            name: 'ข้าวผัดกะเพราแพลนต์เบส (Vegan)',
                            price: 250,
                            cooking: 'ครัวฝรั่ง'
                        }
                    ]
                }
            ]
        }
    },

    setup() {
        return {
            dayjs
        }
    },

    async mounted() {
        setTimeout(() => {
            const el = document.querySelector('.datepicker')
            if (el) {
                el.shadowRoot.children[1].style.display = 'none'
            }
        }, 100)

        this.kitchanName = localStorage.getItem('kitchenName') || 'UPOS Kitchan'
        this.printer = new Printer()
        this.initializePrinter()
        await this.getOrderList()
    },

    methods: {
        async initializePrinter() {
            console.log('Initializing printer...')
            const loading = await loadingController.create({
                message: 'Connecting to printer...',
                spinner: 'crescent',
                mode: 'ios'
            })
            loading.present()
            try {
                this.isConnect = await this.printer.connect()
                console.log('Printer connected:', this.isConnect)
                if (this.isConnect) {
                    console.log('Printer connected successfully')
                    this.printer.initPrinter()
                    console.log('Printer initialized')
                    this.getPrinterStatus(1)
                    console.log('Printer status checked')
                }
            } catch (error) {
                console.error('Error initializing printer:', error)
                loading.dismiss()
            } finally {
                setTimeout(() => {
                    loading.dismiss()
                }, 2000)
            }
        },

        printOrder(item) {
            this.printer.setTextSize(28)
            this.printer.setAlignment(2)
            this.printer.printText(this.kitchanName)
            this.printer.printText('Order No: ' + item.orderNo)
            this.printer.printText('Order Date: ' + dayjs(item.orderDate).format('DD/MM/YYYY'))
            this.printer.setTextSize(26)
            this.printer.printText('Menu:')
            for (let i = 0; i < item.orderItems.length; i++) {
                this.printer.printText(`${i + 1}. ${item.orderItems[i].name}`)
            }
            this.printer.printText('=========================')
            this.printer.setTextSize(24)
            this.printer.printText('Note: Please serve the order as soon as possible.')
            this.printer.partialCut()
            this.printer.printAndFeedPaper(50)
            this.updateStatusPrint(item.id)
        },

        openOrderDetail(order) {
            this.showDetail = true
            this.orderNo = order.orderNo
            this.orderDate = order.orderDate
            this.orderStatus = order.orderStatus
            this.printStatus = order.isPrint
            this.menuList = order.orderItems.map(item => item.name)
            this.selectedOrder = order
        },

        async getOrderList() {
            const value = localStorage.getItem('apiUrl')
            const res = await axios.get(`https://${value}/api/order/history`, {
                params: {
                    orderNo: this.form.orderNo,
                    status: this.form.status,
                    date: this.form.date
                }
            })
            console.log(res.data)
        }
    }
})
</script>
<style scoped>
.right-side {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.no-input {
    width: 25%;
    height: 33.2px;
    border-radius: 8px;
    color: black;
    border: 1px solid #ccc;
    padding: 0 10px;
    margin-left: 10px;
    outline: none;
}
.btn-search {
    background-color: #ffbb00;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 10px;
    margin-left: 10px;
    cursor: pointer;
    height: 33.2px;
}
.btn-search:active {
    background-color: #e86800;
}
</style>
