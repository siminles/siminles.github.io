# Jekyll plugin: 给文章里所有 <img> 自动加 loading="lazy" decoding="async"
# 浏览器原生懒加载，省流量
module Jekyll
  module Tags
    class LazyImageFilter < Liquid::Tag
    end
  end
end

module Jekyll
  module LazyImagesFilter
    def lazy_images(input)
      return input unless input.is_a?(String)
      # 给 <img ...> 加上 loading="lazy" decoding="async"（如果没有的话）
      input.gsub(/<img\b((?![^>]*\bloading=)[^>]*)>/i) do |match|
        attrs = Regexp.last_match(1)
        "<img loading=\"lazy\" decoding=\"async\"#{attrs}>"
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::LazyImagesFilter)
