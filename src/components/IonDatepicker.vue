<template>
    <div class="date-picker">
        <div class="input-wrapper" @click="openModal">
            <div class="date-text">{{ formattedDate }}</div>
        </div>

        <ion-modal :is-open="isModalOpen" @didDismiss="closeModal" class="date-modal">
            <ion-datetime
                v-model="selectedDate"
                presentation="date"
                :max="maxDate"
                locale="th-TH"
            />
        </ion-modal>
    </div>
</template>

<script>
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

export default {
    name: 'DatePicker',

    props: {
        modelValue: {
            type: String,
            default: () => dayjs().format('YYYY-MM-DD')
        }
    },

    emits: ['update:modelValue', 'change'],

    data() {
        return {
            selectedDate: this.modelValue,
            isModalOpen: false,
            maxDate: dayjs().format('YYYY-MM-DD')
        }
    },

    computed: {
        formattedDate() {
            return dayjs(this.selectedDate).format('DD MMM YYYY')
        }
    },

    watch: {
        modelValue(newValue) {
            this.selectedDate = newValue
        },
        selectedDate(newValue) {
            this.$emit('update:modelValue', newValue)
            this.isModalOpen = false
        }
    },

    methods: {
        openModal() {
            this.isModalOpen = true
        },

        closeModal() {
            this.isModalOpen = false
        }
    }
}
</script>

<style lang="scss" scoped>
.date-picker {
    width: 110px !important;

    .input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: #f5f5f7;
        color: var(--ion-color-dark);
        gap: 12px;
        border: 1px solid #0000001a;
        padding: 0 12px;
        border-radius: calc(0.65em - 2px);
        height: 33.2px;
        cursor: pointer;
        transition: all 0.1s;

        &:active {
            background: #e8e8ea;
        }

        .calendar-icon {
            font-size: 20px;
            color: var(--ion-color-medium);
            flex-shrink: 0;
        }

        .date-text {
            flex: 1;
            font-size: 14px;
            font-weight: 400;
        }

        .chevron-icon {
            font-size: 18px;
            color: var(--ion-color-medium);
            flex-shrink: 0;
        }
    }
}

.date-modal {
    --width: 90%;
    --max-width: 350px;
    --height: auto;
    --max-height: 310px;
    --border-radius: 12px;
}

.date-modal ion-content {
    --padding-top: 16px;
    --padding-bottom: 16px;
}
</style>
