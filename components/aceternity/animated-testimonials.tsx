"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => index === active;

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  // ✅ Deterministic "random-like" rotation based on index
  const getRotation = (index: number) => {
    return ((index * 13) % 21) - 10; // stable value in range [-10, 10]
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-sm overflow-x-clip px-4 py-10 font-sans antialiased md:max-w-4xl md:px-8 md:py-20 lg:px-12">
      <div className="relative grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
        <div>
          <div className="relative h-64 w-full sm:h-80">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: getRotation(index), // ✅ stable rotation
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : getRotation(index), // ✅ stable
                    zIndex: isActive(index)
                      ? 40
                      : testimonials.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: getRotation(index), // ✅ stable
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={testimonial.src}
                    alt={testimonial.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-between break-words py-4">
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <h3 className="text-2xl font-bold text-foreground ">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-foreground ">
              {testimonials[active].designation}
            </p>
            <motion.p className="mt-8 text-lg text-foreground ">
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    filter: "blur(10px)",
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>
          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={handlePrev}
              className="group/button flex size-11 items-center justify-center rounded-full bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <IconArrowLeft className="h-5 w-5 text-foreground transition-transform duration-300 group-hover/button:rotate-12 cursor-pointer " />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={handleNext}
              className="group/button flex size-11 items-center justify-center rounded-full bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <IconArrowRight className="h-5 w-5 text-foreground transition-transform duration-300 group-hover/button:-rotate-12 cursor-pointer " />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
