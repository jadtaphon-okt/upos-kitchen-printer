<template>
    <ion-page>
        <ion-header>
            <div class="appbar">
                <div style="display: flex; align-items: center; gap: 5px" @click="$router.back()">
                    <ion-icon
                        style="margin-top: 4px"
                        size="large"
                        :icon="arrowBackOutline"
                    ></ion-icon>
                    <span class="appbar-title">{{ kitchanName }}</span>
                </div>
                <div class="right-side">
                    <button class="no-input status-button" @click="openStatusActionSheet">
                        {{ getStatusLabel(form.status) }}
                    </button>
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

        <ion-content :fullscreen="true" class="ion-padding bg-style">
            <div v-if="isLoadingOrders" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <span>Loading orders...</span>
            </div>
            <div v-else-if="orderList.length === 0" class="empty-state">
                <ion-icon :icon="layersOutline"></ion-icon>
                <span>No orders available</span>
            </div>
            <div
                v-else
                class="order-item card-printed"
                v-for="(order, index) in orderList"
                :key="order.id || index"
            >
                <div class="header">
                    <div>
                        <strong class="title">Order No : {{ order.orderNo }}</strong>
                        <div class="subtitle">
                            เลขโต๊ะ/ห้อง: <strong>{{ order.roomNo || 'N/A' }}</strong> | ลูกค้า:
                            <strong>{{ order.customerName || 'N/A' }}</strong
                            >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Order date:
                            {{ dayjs(order.orderDate).format('DD/MM/YYYY HH:mm') }}
                        </div>
                    </div>
                    <div class="badge" :class="getBadgeClass(order.receivedStatus)">
                        {{ formatStatusToPascalCase(order.receivedStatus) }}
                    </div>
                </div>
                <div class="item-list">
                    <div class="title">รายการอาหาร</div>
                    <ul class="items" v-for="(item, index) in order.orderItems" :key="index">
                        <li class="item">{{ item.name }} x{{ item.amount }}</li>
                    </ul>
                </div>
                <div class="action">
                    <button
                        :class="{
                            'btn-sending': order.receivedStatus === 'cooking',
                            'btn-complete': order.receivedStatus !== 'cooking'
                        }"
                        @click="handleChangeStatus(order)"
                    >
                        ถัดไป : {{ order.receivedStatus === 'cooking' ? 'Sending' : 'Complete' }}
                    </button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>
<script>
import dayjs from 'dayjs'
import { actionSheetController, alertController } from '@ionic/vue'
import { arrowBackOutline, layersOutline } from 'ionicons/icons'
import { defineComponent } from 'vue'
import axios from 'axios'

export default defineComponent({
    name: 'UpdateStatusPage',

    data() {
        return {
            form: {
                orderNo: '',
                status: 'PRINT'
            },
            kitchanName: 'Kitchan Name',
            arrowBackOutline,
            layersOutline,
            orderList: [],
            isLoadingOrders: false
        }
    },

    setup() {
        return {
            dayjs
        }
    },

    async mounted() {
        this.kitchanName = localStorage.getItem('kitchenName') || 'UPOS Kitchan'
        await this.getOrderList()
    },

    methods: {
        getStatusLabel(status) {
            switch (status) {
                case 'ALL':
                    return 'ทั้งหมด'
                case 'cooking':
                    return 'กำลังทำอาหาร'
                case 'sending':
                    return 'รอจัดส่ง'
                case 'complete':
                    return 'เสร็จสมบูรณ์'
                default:
                    return 'ทั้งหมด'
            }
        },
        async openStatusActionSheet() {
            const actionSheet = await actionSheetController.create({
                mode: 'ios',
                header: 'เลือกสถานะ',
                buttons: [
                    {
                        text: 'ทั้งหมด',
                        handler: () => {
                            this.form.status = 'ALL'
                        }
                    },
                    {
                        text: 'กำลังทำอาหาร',
                        handler: () => {
                            this.form.status = 'cooking'
                        }
                    },
                    {
                        text: 'รอจัดส่ง',
                        handler: () => {
                            this.form.status = 'sending'
                        }
                    },
                    {
                        text: 'เสร็จสมบูรณ์',
                        handler: () => {
                            this.form.status = 'complete'
                        }
                    },
                    {
                        text: 'ยกเลิก',
                        role: 'cancel'
                    }
                ]
            })
            await actionSheet.present()
        },

        async getOrderList() {
            this.isLoadingOrders = true
            try {
                const value = localStorage.getItem('apiUrl')
                const params = {
                    cooking_id: localStorage.getItem('kitchenId')
                }
                if (this.form.status !== 'ALL') {
                    params.isPrint = this.form.status
                }
                if (this.form.orderNo) {
                    params.orderNo = this.form.orderNo
                }
                const headers = {
                    Authorization: 'Bearer ' + localStorage.getItem('token')
                }
                const res = await axios.get(`https://${value}/api/order/history`, {
                    params: params,
                    headers: headers
                })
                this.orderList = res.data
            } catch (error) {
                console.error('[UPDATE STATUS] Error loading orders:', error)
            } finally {
                this.isLoadingOrders = false
            }
        },

        formatStatusToPascalCase(status) {
            if (!status) return ''
            // Convert to Pascal case (first letter uppercase, rest lowercase)
            return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        },

        getBadgeClass(status) {
            if (!status) return ''
            const normalizedStatus = status.toLowerCase()
            switch (normalizedStatus) {
                case 'cooking':
                    return 'badge-cooking'
                case 'sending':
                    return 'badge-sending'
                case 'complete':
                    return 'badge-complete'
                default:
                    return ''
            }
        },

        async handleChangeStatus(order) {
            // show confirm dialog
            const alert = await alertController.create({
                mode: 'ios',
                header: 'ยืนยันการเปลี่ยนสถานะ',
                message: `คุณต้องการเปลี่ยนสถานะคำสั่งซื้อหมายเลข ${order.orderNo} ใช่หรือไม่?`,
                buttons: [
                    {
                        text: 'ยกเลิก',
                        role: 'cancel'
                    },
                    {
                        text: 'ยืนยัน',
                        handler: async () => {
                            // call api to change status
                        }
                    }
                ]
            })
            await alert.present()
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
.status-button {
    width: 22% !important;
    text-align: center;
    cursor: pointer;
    background-color: white;
    font-size: 14px;
}
.status-button:active {
    background-color: #f0f0f0;
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

.card-printed {
    flex-direction: column;
    justify-content: unset;
    border: 2px solid #03ba81;
    background-color: #f1fdf4;
    min-height: 200px;
    height: auto;
    padding: 16px;
    .header {
        display: flex;
        border-bottom: 1px solid #828282;
        padding-bottom: 10px;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .title {
            font-size: 18px;
            color: #333;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            color: white;
            &.badge-cooking {
                background-color: #ffc300;
            }
            &.badge-sending {
                background-color: #007aff;
            }
            &.badge-complete {
                background-color: #03ba81;
            }
        }
    }
}
.item-list {
    margin-top: 10px;
    width: 100%;
    .title {
        font-weight: bold;
        margin-bottom: 5px;
    }
    .items {
        margin: 3px 0;
        padding-left: 20px;
        .item {
            font-size: 14px;
            margin-bottom: 3px;
        }
    }
}
.action {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
    width: 100%;

    .btn-sending {
        background-color: #007aff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        &:active {
            background-color: #005bb5;
        }
    }
    .btn-complete {
        background-color: #03ba81;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        &:active {
            background-color: #028a5b;
        }
    }
}
</style>
