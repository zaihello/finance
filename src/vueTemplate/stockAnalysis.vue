<script setup>
import {ref,onMounted} from 'vue'
import { errorMessages } from 'vue/compiler-sfc'
    
    const allStockInfo = ref(null)//快取方式儲存資料
    const stockId = ref('2330')
    const errorMessage = ref('')
    const isHidden = ref(true)
    const ctx = ref(null)

    async function getStockChart() {
        
        const startDate = '2020-01-01'
        const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stockId.value}&start_date=${startDate}`
        const url2 = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInfo`//有股票名稱的資料
        
        //清除舊有的訊息
        errorMessages.value = ''

        if(!stockId.value){
            errorMessage.value = '請輸入股票代碼'
            return
        }

        try{
            const response = await fetch(url)
            const result = await response.json()

            if(!allStockInfo.value){
                const response2 = await fetch(url2)
                const result2 = await response2.json()

                allStockInfo.value = result2//儲存到全域快取
            }
            

            if(!result.data || result.data.length === 0) {
                errorMessage.value = "查無資料"
                //圖表銷毀
                if (window.myChartCanvas) {
                    window.myChartCanvas.destroy()
                }
                isHidden.value = true
               
                return    
            }
            //data是物件裡的陣列資料
            const dates = result.data.map(item => item.date)
            const prices = result.data.map(item => item.close)
            
            //使用快取資料
            const nameInfo = allStockInfo.value.data.find(item => item.stock_id === stockId.value)
            let stockName = stockId.value;
            //預防輸入股票代號股票資訊找不到nameInfo 會回傳 undefined
            if (nameInfo) {
                stockName = nameInfo.stock_name;
            }
            isHidden.value = false 
            drawChart(dates,prices,stockName);
            
        }catch (error) {
            errorMessage.value = '網路請求失敗，請檢查連線。'
            console.error(error)
        }
    

    } 
    function drawChart(dates,prices,stockName) {
        //destroy()為Chart.js方法 清理和移除舊圖表
        if(window.myChartCanvas) {
            window.myChartCanvas.destroy()
        }

        window.myChartCanvas = new Chart(ctx.value,{
            type:'line',
            data:{
                labels:dates,
                datasets:[{
                    label:`${stockId.value}${stockName}收盤價`,
                    data:prices,
                    borderColor:'rgb(75,192,192)',
                    tension:0.5 //線條的平滑程度
                }]
            },
            options:{
                responsive:true,
                //讓圖表不要維持預設(true)的長寬比，並讓它完全依賴容器。
                maintainAspectRatio:false,
                scales:{
                    y:{
                        beginAtZero:false,
                    }
                },
                
            }
        });
    }
    
    //網頁載入時用初始值去執行查詢該股票的動作
    function initializeChart(){
        //value是初始值
        const initialId = stockId.value
        if (initialId) {
            setTimeout(()=>{getStockChart()},50)
        }
    }
    onMounted(()=>{
        initializeChart()
    })
    
</script>
 
<template>
<div class="bg-gray-200 h-screen">
    <h1 class="text-2xl p-6">個股分析</h1>
    
    <div class="border shadow p-6 bg-white">
        <div class="border flex w-full md:w-96">
            <label for="" class="grow py-3 text-center border">股票代碼</label>
            <input type="text" v-model="stockId"  class="border-l border-r py-3 px-3 focus:outline-none focus:ring-2 focus:ring-green-400">
            <button @click="getStockChart()" class="bg-green-400 px-4 py-3 text-center hover:text-white hover:bg-green-500 transition">搜尋</button>
        </div>
        <p class="text-red-500 my-3">{{ errorMessage }}</p>
    </div>
    <!-- :class="{hidden:isHidden}" -->
    <div v-show="!isHidden" class="w-full md:w-1/2 h-96 bg-white mt-10 p-6">
        <canvas ref="ctx"></canvas>
    </div>
</div>    
</template>