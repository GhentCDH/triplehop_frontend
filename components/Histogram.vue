<script>
import { Bar, mixins } from 'vue-chartjs'

const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],
  props: {
    options: {
      type: Object,
      default () {
        return {
          legend: {
            display: false
          },
          scales: {
            yAxes: [
              {
                ticks: {
                  suggestedMin: 0,
                  // Only display integer steps
                  precision: 0
                }
              }
            ]
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
