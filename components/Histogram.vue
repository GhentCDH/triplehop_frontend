<script>
import { Bar, mixins } from 'vue-chartjs'
import { COLOR_PRIMARY } from '~/assets/js/variables'

const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],
  props: {
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
  computed: {
    extractedData () {
      const result = {
        labels: [],
        datasets: [
          {
            backgroundColor: COLOR_PRIMARY,
            data: []
          }
        ]
      }
      for (const bucket of this.chartData.buckets) {
        result.labels.push(`${bucket.key} - ${bucket.key + this.interval}`)
        result.datasets[0].data.push(bucket.doc_count)
      }

      return result
    }
  },
  mounted () {
    this.renderChart(this.extractedData, this.options)
  }
}
</script>
