const ORDER_STATUS = {
    SELECT_PAYMENT : "select_payment",
    WAIT_PAYMENT : "wait_payment",
    COMPLETE : "complete",
    INCOMPLETE : "incomplete",
    VOID : "void",
}

const getStatusOrderDisplay = (status) => {
    switch (status) {
        case ORDER_STATUS.SELECT_PAYMENT:
            return 'Select Payment Method'
        case ORDER_STATUS.WAIT_PAYMENT:
            return 'Processing payment'
        case ORDER_STATUS.COMPLETE:
            return 'Paid'
        case ORDER_STATUS.INCOMPLETE:
            return 'Payment failed'
        case ORDER_STATUS.VOID:
            return 'Void'
    }
    return 'NULL'
}

export {
    getStatusOrderDisplay
}