<template>
    <ion-datetime
        v-model="selectedDate"
        :min="minDate"
        :max="maxDate"
        :displayFormat="format"
        @ionChange="onDateChange"
    ></ion-datetime>
</template>
<script>
import { IonDatetime } from '@ionic/vue'
import { defineComponent } from 'vue'
export default defineComponent({
    name: 'IonDatepicker',
    props: {
        value: {
            type: String,
            required: true
        },
        minDate: {
            type: String,
            default: null
        },
        maxDate: {
            type: String,
            default: null
        },
        format: {
            type: String,
            default: 'YYYY-MM-DD'
        }
    },
    data() {
        return {
            selectedDate: this.value
        }
    },
    watch: {
        value(newValue) {
            this.selectedDate = newValue
        }
    },
    methods: {
        onDateChange(event) {
            this.selectedDate = event.target.value
            this.$emit('input', this.selectedDate)
        }
    }
})
</script>
