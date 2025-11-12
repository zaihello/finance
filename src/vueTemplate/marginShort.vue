<template>
<div v-if="error">
    載入資料失敗：{{ error.message }}
</div>
<div v-else-if="isLoading">
    資料載入中... 請稍候。
</div>
<div 
    v-show="!isLoading && !error"
    ref="chartRef" 
    class="w-full lg:w-1/2 h-[500px]">
</div>
<table class="w-full lg:w-1/2 border">
    <thead>
        <tr>
            <th>日期</th>
            <th>融資買進</th>
            <th>融資賣出</th>
            <th>融資餘額</th>
            <th>融資使用率</th>
            <th>融劵賣出</th>
            <th>融劵買進</th>
            <th>融劵餘額</th>
            <th>劵資比</th>
        </tr>
    </thead>
    <tbody>
        <tr 
            v-for="(object,index) in tableData"
            :key="index"  
        >
            <td 
                v-for="(value,key) in object"
                :key="key"
                class="text-center" 
            >
                {{formatValue(value) }}
            </td>
        </tr>
    </tbody>
</table>
</template>
<script setup>
import { ref,onMounted,onUnmounted,nextTick } from 'vue';


const STOCK_ID = '2330'
const START_DATE = '2022-01-01'
const URL = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=${STOCK_ID}&start_date=${START_DATE}`

const apiData = ref(null)
const chartRef = ref(null)
const tableData = ref([])

let resizeHandler = null
let myChart = null

const isLoading = ref(true)
const error = ref(null)

async function getApi() {
    try{
        const response = await fetch(URL)
        if( !response.ok) {
            throw new Error(`HTTP 錯誤! 狀態碼:${response.status}`);
        }
        const data = await response.json()

        return data
    }catch(err){
        console.error(err);
        throw err;
    }
    
}
function marginShortData(apiData) {
    //日期陣列
    const datesArray = apiData.data.map(object => object.date)
    
    const originalMarginArray = apiData.data.map(object => {      
        return {
            MarginPurchaseBuy:object.MarginPurchaseBuy, 
            MarginPurchaseSell:object.MarginPurchaseSell, 
            MarginPurchaseCashRepayment:object.MarginPurchaseCashRepayment 
        }
    })
    //融資陣列
    const marginsArray = originalMarginArray.map(object => {
        return object.MarginPurchaseBuy - object.MarginPurchaseSell - object.MarginPurchaseCashRepayment
    })
    
    const originalShortArray = apiData.data.map(object => {
        return {
            ShortSaleBuy:object.ShortSaleBuy,
            ShortSaleSell:object.ShortSaleSell,
            ShortSaleCashRepayment:object.ShortSaleCashRepayment
        }
    })
    //融劵陣列
    const shortstArray = originalShortArray.map(object => {
        return object.ShortSaleSell - object.ShortSaleBuy - object.ShortSaleCashRepayment
    })
    return {
        datesArray,
        marginsArray,
        shortstArray 
    }
}
//取20筆資料
function twentyData(apiData) {
    const calculationData = apiData.data.map(object => {
        //融資使用率 = 融資餘額 / 融資限額 * 100%
        const marginUtilization = object.MarginPurchaseTodayBalance / object.MarginPurchaseLimit * 100
        //劵資比 = 融劵餘額張數 / 融資餘額張數 * 100%
        const shortMarginRatio = object.ShortSaleTodayBalance / object.MarginPurchaseTodayBalance * 100
        return {
            日期:object.date,
            融資買進:object.MarginPurchaseBuy,
            融資賣出:object.MarginPurchaseSell,
            融資餘額:object.MarginPurchaseTodayBalance,
            融資使用率:marginUtilization,
            融劵賣出:object.ShortSaleSell,
            融劵買進:object.ShortSaleBuy,
            融劵餘額:object.ShortSaleTodayBalance,
            劵資比:shortMarginRatio
        }
    })
    const viewsData = calculationData.reverse().slice(0,20)
    // console.log('viewsData',viewsData)
    return viewsData
} 
function formatValue(value) {
    
    if( typeof value === 'number' && Number.isInteger(value) === false) {
        return  value.toFixed(2) + '%'
    }else if(typeof value === 'number'){
        return  value.toLocaleString()
    }

    return value;
}

function drawChart(data,chartInstance) {
    const option ={ 
        title:{
            text:'融資融劵'
        },
        tooltip:{
            trigger:'axis',
            axisPointer:{
                type:'shadow'
            },
        },
        legend:{
            data:['融資變化','融劵變化'],
            bottom:10//在底部位置
        },
        grid:{
            left:'10',
            right:'10',
            containLabel:true//(X、Y軸)標籤能被完整顯示在區域內
        },
        xAxis:{
            type:'category',
            data:data.datesArray
        },
        yAxis:{
            type:'value'
        },
        series:[
            {
                name:'融資變化',
                type:'bar',
                data:data.marginsArray
            },
            {
                name:'融劵變化',
                type:'bar',
                data:data.shortstArray
            }
        ]
    }
    chartInstance.setOption(option)
}

async function main() {
    isLoading.value = true;
    error.value = null;
    try{
        apiData.value = await getApi()
        const data = marginShortData(apiData.value)
        tableData.value = twentyData(apiData.value)
        // 基于准备好的dom，初始化echarts实例
        myChart = echarts.init(chartRef.value)

        drawChart(data,myChart)

        resizeHandler = () => {
            myChart.resize()
        }
        // //加入resize()圖表才會自動響應其容器。
        window.addEventListener('resize',resizeHandler)

    }catch(err){
        error.value = err
        console.error(err)
    }finally {
        isLoading.value = false
        
        await nextTick(() => { 
            if (myChart) {
                myChart.resize()
            }
        })
         
    }  
}
 
onMounted(main)
onUnmounted(() => {
    if(resizeHandler) {
        window.removeEventListener('resize',resizeHandler)
    }
    if(myChart) {
        myChart.dispose()//銷毀實例方法
    }
   
})
 
</script>
<style scoped>
tbody tr:nth-child(odd) {
    background-color:rgba(231, 230, 230, 0.904);
}
</style>