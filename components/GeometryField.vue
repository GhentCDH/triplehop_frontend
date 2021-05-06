<template>
  <client-only>
    <div class="map-wrapper">
      <l-map
        ref="map"
        @ready="onMapReady"
      >
        <!-- TODO: use actual base layer (entity_data[field.base_layer]) -->
        <!-- TODO: provide a way to configure a default base layer (project / entity based) -->
        <!-- TODO: add button to display larger map? -->
        <l-tile-layer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png"
          attribution="Tiles &copy; <a href='http://esri.com'>Esri</a>"
          :options="{ maxZoom: 17 }"
        />
        <l-feature-group ref="feature-group">
          <!-- TODO: display other geometry types -->
          <l-marker v-if="geometryObject.type === 'Point'" :lat-lng="[...geometryObject.coordinates].reverse()" />
        </l-feature-group>
      </l-map>
    </div>
  </client-only>
</template>

<script>
export default {
  props: {
    geometry: {
      type: String,
      required: true
    }
  },
  computed: {
    geometryObject () {
      return JSON.parse(this.geometry)
    }
  },
  methods: {
    onMapReady () {
      this.$refs.map.mapObject.fitBounds(
        this.$refs['feature-group'].mapObject.getBounds(),
        {
          maxZoom: 13
        }
      )
    }
  }
}
</script>
