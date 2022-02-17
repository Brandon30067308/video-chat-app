import { Pagination, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faArrowRight, faArrowLeft, faVideo, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import 'swiper/swiper-bundle.min.css';

const Info = () => {
  return (
    <Swiper
      spaceBetween={20}
      slidesPerView={1}
      slidesPerGroup={1}
      modules={[Pagination, Navigation]}
      loop={true}
      loopFillGroupWithBlank={true}
      speed={700}
      pagination={{
        el: '.swiper-pagination'
      }}
      navigation={{
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      }}
    >
      <div className="swiper-pagination"></div>
      <div className="swiper-button right">
        <button
          className="swiper-button-next icon-button"
          style={{
            right: '0'
          }}>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      <div className="swiper-button left">
        <button
          className="swiper-button-prev icon-button"
          style={{
            left: '0'
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      </div>
      <SwiperSlide>
        <div className="how-to">
          <i className="flex icon">
            <FontAwesomeIcon icon={faVideo} />
          </i>
          <p className="heading-lg">Create a room</p>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        <div className="how-to">
          <i className="flex icon">
            <FontAwesomeIcon icon={faShareNodes} />
          </i>
          <p className="heading-lg">Share room link</p>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        <div className="how-to">
          <i className="flex icon">
            <FontAwesomeIcon icon={faComments} />
          </i>
          <p className="heading-lg">Start Meeting</p>
        </div>
      </SwiperSlide>
    </Swiper>
  );
}

export default Info;