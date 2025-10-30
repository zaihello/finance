<template>
<div class="w-full">
    <div ref="chartRef" class="w-full lg:w-1/2 h-[500px]"></div>
    <table class="w-full lg:w-1/2 border">
        <thead>
            <tr>
                <th colspan="5" class="text-right pr-2 text-sm">單位：千</th>
            </tr>
            <tr>
                <th>日期</th>
                <th>外資</th>
                <th>投信</th>
                <th>自營商</th>
                <th>合計</th>
            </tr>
        </thead>
        <tbody >
            <tr 
                v-for="data of tbodyData"
                :key="data.date" 
                class="text-center"  
            >
                <td>{{data.date}}</td>
                <td>{{data.foreign.toLocaleString()}}</td>
                <td>{{data.trust.toLocaleString()}}</td>
                <td>{{data.daler.toLocaleString()}}</td>
                <td
                    :class="{'text-rose-500':data.total > 0,
                    'text-green-500':data.total < 0}"
                >
                    {{data.total.toLocaleString()}}
                </td>
            </tr>           
        </tbody>
    </table>   
</div>    
</template>
<script setup>
import {ref,onMounted, onUnmounted} from 'vue'
    // 外資、投信、自營
    const STOCK_ID = '2330'
    const START_DATE = '2022-01-01'
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id=${STOCK_ID}&start_date=${START_DATE}`

    const tbodyData = ref([])
    const chartRef = ref(null)
    let chart = null //宣告圖表實例
    const resizeChart = () => {
        if(chart) {
            chart.resize()
        }
    }

    async function getData() {
        try{
            const respon = await fetch(url)

            if(!respon.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼:${respon.status}`)
            }
            return await respon.json()
        }catch(error){
            console.error('取得資料失敗:',error) 
            throw error   
        }  
    } 
    //單位:千，所以除1000，並四捨五入  
    function institutionalTrading(stockData) {
        const originalDate = stockData.data.map( item => item.date)
        //x軸日期陣列
        const datesArray = Array.from(new Set(originalDate))
        const originalTrusts = stockData.data.filter( item => 
            item.name === 'Investment_Trust'
        )
        //投信陣列
        const trustsArray = originalTrusts.map( item =>
          Math.round((item.buy - item.sell) / 1000)
        )
        //外資(Foreign_Investor、Foreign_Dealer_Self)
        const originalForeign = stockData.data.filter( item => 
            item.name === 'Foreign_Investor' || item.name === 'Foreign_Dealer_Self' 
        )
        const groupForeign = originalForeign.reduce((acc,item) => {
            const lastArray = acc[acc.length - 1]
            if(acc.length == 0 || lastArray[0].date !== item.date){
                acc.push([item])
            }else{
                lastArray.push(item)
            }
            return acc
        },[])
        // 外資陣列
        const foreignsArray = groupForeign.map(item => {
          return Math.round((( item[0].buy - item[0].sell ) + ( item[1].buy - item[1].sell )) /1000)
        })

        //自營商(Dealer_self、Dealer_Hedging)
        const originaldDaler = stockData.data.filter( item => {
           return item.name === 'Dealer_self' || item.name === 'Dealer_Hedging'
        })
        const groupDaler = originaldDaler.reduce((acc,item) => {
            //正在建立的組
            const lastArray = acc[acc.length - 1]
            
            if(acc.length === 0 || lastArray[0].date != item.date) {
                acc.push([item])
            }else {
                lastArray.push(item)
            }
            return acc
        },[])
        //自營商陣列
        const dalersArray = groupDaler.map(item => {
            return Math.round(((item[0].buy - item[0].sell) + (item[1].buy - item[1].sell)) / 1000) 
        })
        //合計
        const originalTotal = [trustsArray,foreignsArray,dalersArray]
        //合計陣列
        const totalsArray = originalTotal.reduce((acc,currentArray) => {
            currentArray.forEach( (value,index) => {
                if(acc[index] === undefined) {
                    acc[index] = 0
                }

                acc[index] += value
            })
            return acc  
        },[])
       
        return {
            datesArray,
            trustsArray,
            foreignsArray,
            dalersArray,
            totalsArray
        }
     
    }
    //繪圖
    function drawChart(data) {
        const option = {
            title: {
                text:'三大法人買賣超'
            },
            tooltip:{
                trigger:'axis',
                axisPointer:{
                    type:'shadow'
                }
            },
            legend:{
                data:['外資','投信','自營商'],
                bottom:10
            },
            grid:{
                left:'10',
                right:'10',
                containLabel:true//(X、Y軸)標籤能被完整顯示在區域內
            },
            xAxis: {
                type:'category',
                data:data.datesArray,
                // axisLabel: {

                // },
            },
            yAxis: {
                type:'value',
            },
            series:[
                {
                    name:'外資',
                    type:'bar',
                    stack:'total',//堆疊長條圖
                    data:data.foreignsArray
                },
                {
                    name:'投信',
                    type:'bar',
                    stack:'total',
                    data:data.trustsArray
                },
                {
                    name:'自營商',
                    type:'bar',
                    stack:'total',
                    data:data.dalersArray
                },
                {
                    name:'合計',
                    type:'bar',
                    stack:'none',//不要堆疊
                    data:data.totalsArray,
                    //將堆疊元素隱藏
                    itemStyle: {
                        opacity:0,
                    },
                    //確保不會影響圖例（即使圖例中沒有它）
                    legendHoverLink:false
                }
            ]
        } 
        chart.setOption(option)

    }
    //取20筆資料(最新開始)
    function view(data) {
        const dates = data.datesArray.reverse().slice(0,20)
        const foreigns = data.foreignsArray.reverse().slice(0,20) 
        const trusts = data.trustsArray.reverse().slice(0,20)
        const dalers = data.dalersArray.reverse().slice(0,20)
        const totals = data.totalsArray.reverse().slice(0,20)
       
        for(let i = 0 ; i < dates.length ; i++ ) {
            const date = dates[i]
            const foreign = foreigns[i]
            const trust = trusts[i]
            const daler = dalers[i]
            const total = totals[i]

            tbodyData.value.push(
                {
                    date,
                    foreign,
                    trust,
                    daler,
                    total
                }

            )
        }    
        return tbodyData
    }
    
    onMounted(() => {
        getData()
        .then((fetchData) => {

            const threeMajorInstitutionsData = institutionalTrading(fetchData)
                    chart = echarts.init(chartRef.value)

            drawChart(threeMajorInstitutionsData)

            view(threeMajorInstitutionsData)

            //監聽  加入resize()圖表才會自動響應其容器。
            window.addEventListener('resize',resizeChart)

        })
        .catch((err) => {
            console.error(err)
        })
    })


    onUnmounted(() => {
        window.removeEventListener('resize',resizeChart)
    })
    
</script>
<style scoped>
tbody tr:nth-child(odd) {
    background-color:rgba(231, 230, 230, 0.904)
}

</style>