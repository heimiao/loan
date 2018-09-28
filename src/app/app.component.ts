import { Component, OnInit, ElementRef } from '@angular/core';
import * as format from 'date-fns/format';
import G2 from '@antv/g2';
import * as moment from 'moment';
// import { View } from '@antv/data-set';
import DataSet from '@antv/data-set';
import {
    FormBuilder,
    FormGroup,
    Validators,
	} from '@angular/forms';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  filter = {
        baseRate: 4.90 * 0.01,
        rate: 1.1,
        rateAry: [1, 1.05, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 0.7, 0.8, 0.83, 0.85, 0.88, 0.9, 0.95],
        rateList: [],
        yearList: [],
    };
    chart: any = null;
    chart2: any = null;
    chart3: any = null;

    loanAray: Array<any> = [];
    loanDetailAray: Array<any> = [];
    ds: any = new DataSet({ state: { currentState: {}, loanState: {}, loanDetailState: {} } });

    validateForm: FormGroup;
    constructor(
    	private fb: FormBuilder,
        private el: ElementRef,
    ) { }

    calculationRate(args) {
        const result = Number((this.filter.baseRate * args));
        this.validateForm.patchValue({ rateResult: `${(result * 100).toFixed(2)}%` });
        return result;
    }
    init() {
        for (let i = 0; i < this.filter.rateAry.length; i++) {
            const num = Number(this.filter.rateAry[i]);
            this.filter.rateList.push(
                {
                    label: `${num === 1 ? '基准' : num + (num < 1 ? '折' : '倍')}`,
                    value: num
                }
            );
        }
        for (let i = 1; i <= 30; i++) {
            this.filter.yearList.push({ label: `${i}年`, value: i });
        }

        this.validateForm = this.fb.group({
            money: 50,
            rate: this.filter.rate,
            years: 15,
            rateResult: `${(this.filter.baseRate * this.filter.rate * 100).toFixed(2)}%`,
            loanType: '0',
        });
        this.validateForm.get('years').valueChanges.subscribe(args => {
            if (args > 5)
                this.filter.baseRate = 4.90 * 0.01;
            else
                this.filter.baseRate = 4.75 * 0.01;
            this.calculationRate(this.validateForm.get('rate').value);
        });
        this.validateForm.get('rate').valueChanges.subscribe(args => {
            this.calculationRate(args);
        });

        // this.select2();
    }

    ngOnInit(): void {
        this.init();
        console.log(this.el.nativeElement.querySelector('#loanDetaiPic'));
        // const { loanDetailAray } = this.calculation(50 * 10000, 15, this.calculationRate(1.1), 0);
        //  console.log(loanDetailAray);
        // this.select2(loanDetailAray);
    }

    submitForm(): void {
        const { loanType, money, rate, years } = this.validateForm.controls;
        // 计算贷款
        this.calculation(money.value * 10000, years.value, this.calculationRate(rate.value), loanType.value);
         
         this.select2();
         this.selected();

        // this.chart2.changeData(this.loanDetailAray);
    }

    select2(data: any = this.loanDetailAray) {
        // 通过connector方法转化数据
        const dv = this.ds.createView().source(data);
        // 数据处理
        dv.transform({
            type: 'fold',
            fields: ['monthlyInterest', 'monthlyPrincipal','monthlySupply'],
            // alias: ['月供', '月供利息', '月供本金', '剩余'],
            // 展开字段集'monthlySupply', 'monthlyInterest', 'monthlyPrincipal','surplusCost'
            key: 'monthlyType', // key字段
            value: 'money', // value字段
            // retains: ['year'],  // 保留字段集，默认为除 fields 以外的所有字段
        });

        this.chart2 = this.chart2 ? this.chart2 : new G2.Chart({
            container: this.el.nativeElement.querySelector('#loanDetaiPic'),
            forceFit: true,
            height: 400, // 屏幕分辨率
        });
        // 填充数据
        this.chart2.source(dv);
        /* this.chart2.axis('money', {
            label: {
                formatter: val => {
                    return val / 1000000 + 'M';
                }
            }
        }); */

        // 数据度量
        this.chart2.scale({
            limit: { tickCount: 20 },
            money: {
                /* type: { string }, // 度量的类型
                range: { array }, // 数值范围区间，即度量转换的范围，默认为 [0, 1]
                alias: { string }, // 为数据属性定义别名，用于图例、坐标轴、tooltip 的个性化显示
                ticks: { array }, // 存储坐标轴上的刻度点文本信息
                tickCount: { number }, // 坐标轴上刻度点的个数，不同的度量类型对应不同的默认值 */
                // ticks: ['月供', '月供利息', '月供本', '剩余'],
                type: 'log',
                // alias: '金额', // 设置属性的别名
                formatter: val => `${val}元`,
            }
        });
        this.chart2.on('tooltip:change', evt => {
            const items = evt.items || [];
            // if (items.length > 0)
            // ds.setState('currentState', items[0].title);
        });
       /* this.chart2.legend({
            position: 'top'
        });*/
        this.chart2.area()
            .position('limit*money')
            .color('monthlyType');
        this.chart2.render();
    }
    // 创建饼状百分比
    perCentPic(data: any = this.loanAray) {
        // 创建
        const dv3 = this.ds.createView('loanPercent').source(data);
        dv3.transform({
            type: 'filter',
            callback(row) {
                return row.state === this.ds.state.currentState;
            }
        }).transform({
            type: 'percent', // 百分比
            field: 'money',
            dimension: 'monthlyType',
            as: 'percent'
        });
        // console.log(dv3);
        this.chart3 = this.chart3 ? this.chart3 : new G2.Chart({
            id: this.el.nativeElement.querySelector('#loanPercent'),
            forceFit: true,
            height: 300,
            padding: 0,
        });

        this.chart3.source(dv3);
        this.chart3.coord('theta', {
            radius: 0.8 // 设置饼图的大小
        });

        this.chart3.intervalStack()
            .position('percent')
            .color('monthlyType')
            .label('monthlyType*percent', function(monthlyType, percent) {
                percent = (percent * 100).toFixed(2) + '%';
                return monthlyType + ' ' + percent;
            });
        this.chart3.render();
    }

    selected(data: any = this.loanAray) {
        /*  monthlyInterest: monthlyInterest.toFixed(2), // 每月应还利息
            monthlyPrincipal: monthlyPrincipal.toFixed(2), // 每月应还本金
            monthlyDiminish: monthlyDiminish.toFixed(2), // 如果是本金每月递减金额
            totalMoney: totalMoney.toFixed(2),  // 还款总金额
            monthlySupply: monthlySupply.toFixed(2), // 月供
            totalInterest: totalInterest.toFixed(2), // 总利息 */
        // 接入数据
        const dv = this.ds.createView().source(data);
        // 数据处理
        dv.transform({
            type: 'fold',
            fields: ['totalMoney', 'totalInterest'], // 展开字段集
            key: 'key', // key字段
            value: 'value', // value字段
            // retains: ['year'],  // 保留字段集，默认为除 fields 以外的所有字段
        });

        this.chart = this.chart ? this.chart : new G2.Chart({
            container: this.el.nativeElement.querySelector('#loanPic'),
            forceFit: true,
            height: window.innerHeight, // 屏幕分辨率
        });
        // 数据度量
        this.chart.source(dv, {
            value: {
                /* type: { string }, // 度量的类型
                range: { array }, // 数值范围区间，即度量转换的范围，默认为 [0, 1]
                alias: { string }, // 为数据属性定义别名，用于图例、坐标轴、tooltip 的个性化显示
                ticks: { array }, // 存储坐标轴上的刻度点文本信息
                tickCount: { number }, // 坐标轴上刻度点的个数，不同的度量类型对应不同的默认值 */
                alias: `金额`,
                type: 'linear',
                formatter: val => `${val}元`,
            }
        });

        this.chart.tooltip({
            crosshairs: {
                type: 'line'
            }
        });

        this.chart.axis('value', {
            label: {
                formatter: function formatter(val) {
                    return val;
                }
            }
        });

        // this.chart.line().position('year*value').color('key').shape('smooth');
        this.chart.interval().position('year*value').color('value', ['#1f77b4', '#ff7f0e', '#2ca02c']).shape('circle');
        // this.chart.heatmap().position('year*value').color('value').shape('circle');
        /* this.chart.point().position('year*value').color('key').size(4).shape('circle').style({
            stroke: '#fff',
            lineWidth: 1
        }); */

        this.chart.render();
    }

    // 贷款计算  总金额，年限,利率
    calculation(cost = 10000, years = 5, rate = this.filter.baseRate, repaymentType) {
        this.loanAray = [];
        this.loanDetailAray = [];
        // 贷款详细
        const loanDetailAray = this.calculatingLoanDetail(cost, years, rate, repaymentType);
        const loanAray = this.calculatingLoan(cost, years, rate, repaymentType);
        this.loanAray = loanAray;
        this.loanDetailAray = loanDetailAray;
        return { loanAray, loanDetailAray };
    }

    calculatingLoan(cost, years, rate, repaymentType) {
        /*1、等额本息计算公式：
           每月月供额 =〔贷款本金×月利率×(1＋月利率) ＾还款月数〕÷〔(1＋月利率) ＾还款月数 - 1〕
           每月应还利息 = 贷款本金×月利率×〔(1 + 月利率) ^ 还款月数 - (1 + 月利率) ^ (还款月序号 - 1) 〕÷〔(1 + 月利率) ^ 还款月数 - 1〕
           每月应还本金 = 贷款本金×月利率×(1 + 月利率) ^ (还款月序号 - 1) ÷〔(1 + 月利率) ^ 还款月数 - 1〕
           总利息 = 还款月数×每月月供额 - 贷款本金
         2、等额本金计算公式
           每月月供额=(贷款本金÷还款月数)+(贷款本金-已归还本金累计额)×月利率
           每月应还本金=贷款本金÷还款月数
           每月应还利息=剩余本金×月利率=(贷款本金-已归还本金累计额)×月利率
           每月月供递减额=每月应还本金×月利率=贷款本金÷还款月数×月利率
           总利息=还款月数×(总贷款额×月利率-月利率×(总贷款额÷还款月数)*(还款月数-1)÷2+总贷款额÷还款月数)
           月利率=年利率÷12*/
        /* const loanDetailAray = this.calculatingLoanDetail(cost, years, rate, repaymentType); */
        const loanAray: Array<any> = [];
        // 月利率
        const monthRate = rate / 12; // 月利率
        for (let i = 1; i <= years; i++) {
            const monthNumber = i * 12; // 月数
            // 贷款统计
            // 每月月供额
            let monthlySupply = (cost * monthRate * Math.pow(1 + monthRate, monthNumber)) / (Math.pow(1 + monthRate, monthNumber) - 1);
            // 总利息
            let totalInterest = monthNumber * monthlySupply - cost;
            // 总金额
            let totalMoney = totalInterest + cost;
            // 每月递减金额
            let monthlyDiminish = 0;
            // 等额本金
            if (repaymentType === '1') {
                const monthlyPrincipal = cost / monthNumber;
                // 第一月月供额以后每月递减
                monthlySupply = (cost / monthNumber + cost * monthRate);
                // 每月月供递减额
                monthlyDiminish = monthlyPrincipal * monthRate;
                // 总利息
                totalInterest = monthNumber * (cost * monthRate -
                    monthRate * (cost / monthNumber) * (monthNumber - 1) / 2 +
                    cost / monthNumber) - cost;
                // 总金额
                totalMoney = totalInterest + cost;
            }
            const obj = {
                year: `${i}年`, // moment().add(i, 'y').format('YYYY'),
                monthlyDiminish: monthlyDiminish.toFixed(2), // 如果是本金每月递减金额
                totalMoney: totalMoney.toFixed(2),  // 还款总金额
                monthlySupply: monthlySupply.toFixed(2), // 月供
                totalInterest: totalInterest.toFixed(2), // 总利息
            };
            loanAray.push(obj);
        }
        return loanAray;
    }

    calculatingLoanDetail(cost: any, years, rate, repaymentType) {
        const loanDetailAray: Array<any> = [];
        // 月利率
        const monthRate = rate / 12; // 月利率
        const monthNumber = years * 12; // 月数
        let monthSerial = 1; // 月序号
        let repaymentSum = 0; // 已归还本金累计额
        for (let o = 1; o <= monthNumber; o++) {
            monthSerial = o;
            // 月供额
            let monthlySupply = (cost * monthRate * Math.pow(1 + monthRate, monthNumber)) / (Math.pow(1 + monthRate, monthNumber) - 1);
            // 利息
            let monthlyInterest = cost * monthRate * (Math.pow(1 + monthRate, monthNumber) -
                Math.pow(1 + monthRate, monthSerial - 1)) / (Math.pow(1 + monthRate, monthNumber) - 1);
            // 本金
            let monthlyPrincipal = cost * monthRate * Math.pow(1 + monthRate, monthSerial - 1) / (Math.pow(1 + monthRate, monthNumber) - 1);
            if (repaymentType === '1') {
                // 月供总额
                monthlySupply = (cost / monthNumber + (cost - repaymentSum) * monthRate);
                // 月供利息
                monthlyInterest = (cost - repaymentSum) * monthRate;
                // 月供本金
                monthlyPrincipal = cost / monthNumber;
            }
            repaymentSum += monthlyPrincipal;
            const surplusCost = Math.abs(cost - repaymentSum); // 剩余款项
            const loanDetail: any = {};
            loanDetail.monthlySupply = monthlySupply.toFixed(2);
            loanDetail.monthlyInterest = monthlyInterest.toFixed(2);
            loanDetail.monthlyPrincipal = monthlyPrincipal.toFixed(2);
            loanDetail.surplusCost = surplusCost.toFixed(2);
            loanDetail.limit = `${o}期`;
            loanDetail.date = moment().add(o, 'M').format('YYYY-MM');
            loanDetailAray.push(loanDetail);
        }
        return loanDetailAray;
    }
	}
