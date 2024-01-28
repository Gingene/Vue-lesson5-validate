const { defineRule, Form, Field, ErrorMessage, configure } = VeeValidate;
const { required, email, min, max } = VeeValidateRules;
const { localize, loadLocaleFromURL } = VeeValidateI18n;

defineRule('required', required);
defineRule('email', email);

loadLocaleFromURL('https://unpkg.com/@vee-validate/i18n@4.1.0/dist/locale/zh_TW.json');

configure({
  generateMessage: localize('zh_TW'),
});

const api = 'https://vue3-course-api.hexschool.io/v2';
const api_path = 'gingene-test';
const path = {
  products: `api/${api_path}/products`,
  product: `api/${api_path}/product`,
  carts: `api/${api_path}/carts`,
  cart: `api/${api_path}/cart`,
  order: `api/${api_path}/order`,
};
let productModal = null;

axios.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    console.log(err);
    Swal.fire({
      icon: 'error',
      text: err.data.message,
    });
    return Promise.reject(err); //必須回傳err，否則axios會拋出錯誤
  },
);

const app = Vue.createApp({
  data() {
    return {
      products: [],
      productInfo: {},
      cart: {
        carts: [],
        total: 0,
        final_total: 0,
      },
      form: {
        user: {
          name: '',
          email: '',
          tel: '',
          address: '',
        },
        message: '',
      },
      userPhone: '',
      isLoading: false,
      buyLoading: false,
    };
  },
  methods: {
    async getProducts() {
      try {
        this.toggleLoading();
        const res = await axios.get(`${api}/${path.products}?page=3`);
        this.products = res.data.products;
        this.toggleLoading();
      } catch (error) {
        console.error(error);
      }
    },
    async getProduct(id) {
      try {
        this.toggleLoading();
        const res = await axios.get(`${api}/${path.product}/${id}`);
        this.productInfo = { ...res.data.product };
        this.toggleLoading();
      } catch (err) {
        console.error(err);
      }
    },
    async getCart() {
      this.toggleLoading();
      try {
        const res = await axios.get(`${api}/${path.cart}`);
        this.cart = { ...res.data.data };
        console.log(res);
      } catch (error) {
        console.error(error);
      }
      this.toggleLoading();
    },
    async addCart(id, qty = 1) {
      try {
        await axios.post(`${api}/${path.cart}`, {
          data: {
            product_id: id,
            qty,
          },
        });
        this.alertInfo('success', '已加入購物車');
        this.getCart();
      } catch (error) {
        console.error(error);
      }
    },
    async modalAddCart(id, qty) {
      this.toggleBuyLoading();
      await this.addCart(id, qty);
      this.toggleBuyLoading();
      this.closeModal();
    },
    async changeNumCartProduct(product_id, qty) {
      this.toggleBuyLoading();
      try {
        await axios.put(`${api}/${path.cart}/${product_id}`, {
          data: {
            product_id,
            qty,
          },
        });
        this.alertInfo('success', '已更改數量');
        this.getCart();
      } catch (error) {
        console.error(error);
      }
      this.toggleBuyLoading();
    },
    async deleteCartProduct(id) {
      this.toggleBuyLoading();
      try {
        await axios.delete(`${api}/${path.cart}/${id}`);
        this.alertInfo('success', '已刪除購物車內該品項');
        this.getCart();
      } catch (error) {
        console.error(error);
      }
      this.toggleBuyLoading();
    },
    async deleteCart() {
      this.toggleBuyLoading();
      try {
        await axios.delete(`${api}/${path.carts}`);
        this.alertInfo('success', '已清空購物車');
        this.getCart();
      } catch (error) {
        console.error(error);
      }
      this.toggleBuyLoading();
    },
    twPhone(value) {
      if (value.trim() === '') return '電話為必填';
      const regex = /^09\d{8}$/g;
      return regex.test(value) || '需要正確的台灣手機號碼';
    },
    async handleSubmit(data) {
      this.toggleBuyLoading();
      try {
        const handleData = {
          name: data.姓名,
          email: data.email,
          tel: data.tel,
          address: data.地址,
        };
        this.form.user = { ...this.form.user, ...handleData };
        const res = await axios.post(`${api}/${path.order}`, { data: this.form });
        console.log(res);
        this.alertInfo('success', '訂單送出成功，我們會盡快與您聯繫');
      } catch (error) {
        console.error(error);
      }
      this.toggleBuyLoading();
      this.$refs.form.resetForm();
      this.form.message = '';
      this.getCart();
    },
    toggleLoading() {
      this.isLoading = !this.isLoading;
    },
    toggleBuyLoading() {
      this.buyLoading = !this.buyLoading;
    },
    alertInfo(icon, text) {
      Swal.fire({
        icon,
        text,
      });
    },
    async openModal(id) {
      await this.getProduct(id);
      productModal.show();
    },
    closeModal() {
      productModal.hide();
    },
  },
  mounted() {
    this.getProducts();
    this.getCart();
    console.log(this.$refs);
  },
});

app.component('product-modal', {
  template: '#userProductModal',
  props: ['product-info'],
  data() {
    return {
      qty: 1,
    };
  },
  methods: {
    updateToCart() {
      this.$emit('update-cart', this.productInfo.id, this.qty);
    },
  },
  mounted() {
    productModal = new bootstrap.Modal(this.$refs.modal);
  },
});

app.component('loading', {
  template: '#loading',
});

app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);
Object.keys(VeeValidateRules).forEach((rule) => {
  if (rule !== 'default') {
    VeeValidate.defineRule(rule, VeeValidateRules[rule]);
  }
});

app.mount('#app');
