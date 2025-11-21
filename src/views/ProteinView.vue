<template>
  <div class="mainBody">
    <div class="protein-container">
      <ProteinViewer
        :pdb-id="selectedPdbId"
        :render-mode="selectedMode"
        @load="onProteinLoad"
        @error="onProteinError"
      />
    </div>
    <div class="info-box">
      <p>拖拽旋转，滚轮缩放</p>
      <p>白色亮点为功能位点</p>
      <div class="controls-container">
        <div class="pdb-selector">
          <label for="pdb-select">选择蛋白质: </label>
          <select id="pdb-select" v-model="selectedPdbId">
            <option value="1MBO">肌红蛋白 (1MBO)</option>
            <option value="1RPN">核糖核酸酶A (1RPN)</option>
            <option value="2HHB">血红蛋白 (2HHB)</option>
            <option value="1TIM">磷酸丙糖异构酶 (1TIM)</option>
          </select>
        </div>
        <div class="render-mode-selector">
          <label for="mode-select">渲染模式: </label>
          <select id="mode-select" v-model="selectedMode">
            <option value="points">点云模式</option>
            <option value="wireframe">线框模式</option>
            <option value="ballAndStick">球棍模型</option>
            <option value="cartoon">卡通模式</option>
            <option value="surface">表面模式</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ProteinViewer from '@/components/ProteinViewer.vue';

const pdbOptions = {
  '1MBO': { name: '肌红蛋白', description: '储存氧气的肌肉蛋白' },
  '1RPN': { name: '核糖核酸酶A', description: '降解RNA的酶' },
  '2HHB': { name: '血红蛋白', description: '运输氧气的血液蛋白' },
  '1TIM': { name: '磷酸丙糖异构酶', description: '糖酵解途径中的关键酶' }
};

const selectedPdbId = ref('1MBO');
const selectedMode = ref('cartoon'); // 默认模式

const onProteinLoad = () => {
  console.log('Protein loaded successfully');
};

const onProteinError = (error) => {
  console.error('Failed to load protein:', error);
};
</script>

<style scoped>
.mainBody {
  font-family: 'Arial', sans-serif;
  color: #fff;
  background: #000;
  padding: 0;
  margin: 0;
  min-height: 100vh;
  position: relative;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  overflow: hidden;
}

.protein-container {
  width: 100%;
  max-width: 1200px;
  height: 600px;
  min-width: 300px;
  margin: 1rem 0;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.info-box {
  width: 100%;
  max-width: 1200px;
  text-align: center;
  padding: 0.5rem 0;
  color: #aaa;
  font-size: 0.9rem;
}

.controls-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem; /* 在选择器之间添加间距 */
  margin-top: 0.5rem;
  flex-wrap: wrap; /* 允许换行，以防空间不足 */
}

.pdb-selector,
.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pdb-selector label,
.render-mode-selector label {
  white-space: nowrap; /* 防止标签换行 */
}

.pdb-selector select,
.render-mode-selector select {
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .protein-container {
    height: 400px;
    margin: 0.5rem 0;
  }
  .info-box {
    font-size: 0.8rem;
  }
  .controls-container {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>