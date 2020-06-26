<script>
import { Bar, mixins } from 'vue-chartjs'

const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],
  props: {
    chartdata: {
      type: Object,
      default () { return {} }
    },
    interval: {
      type: Number,
      default: 10
    },
    options: {
      type: Object,
      default () {
        return {
          legend: {
            display: false
          }
        }
      }
    }
  },
  mounted () {
    this.renderChart(this.chartData, this.options)
  }
}
</script>
