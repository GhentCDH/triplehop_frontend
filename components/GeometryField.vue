<template>
  <dd>
    <client-only>
      <div class="map-wrapper">
        <l-map ref="map">
          <!-- TODO: use actual base layer (entity_data[field.base_layer]) -->
          <!-- TODO: provide a way to configure a default base layer (project / entity based) -->
          <l-tile-layer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}.png" attribution="Tiles &copy; <a href='http://esri.com'>Esri</a>" />
          <l-feature-group ref="feature-group">
            <!-- TODO: display other geometry types -->
            <l-marker v-if="geometry.type === 'Point'" :lat-lng="[...geometry.coordinates].reverse()" />
          </l-feature-group>
        </l-map>
      </div>
    </client-only>
  </dd>
</template>

<script>

export default {
  props: {
    geometry: {
      type: Object,
      required: true
    }
  },
  mounted () {
    this.$refs.map.mapObject.flyToBounds(
      this.$refs['feature-group'].getBounds()
    )
  }
}
</script>
